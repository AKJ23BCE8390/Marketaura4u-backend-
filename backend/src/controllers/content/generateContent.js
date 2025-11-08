const User = require('../../models/User'); // Check your path
const Job = require('../../models/job');   // Check your path

/**
 * 🛎️ PART 1: THE "WAITER" (Now waits for the food)
 * --- THIS IS THE UPDATED PART ---
 */
const generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id; // Get user from auth middleware

    // 1. Check for basic info
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.onboardingCompleted) {
      return res.status(400).json({ message: 'Please complete onboarding first' });
    }

    // 2. Create the "Job Ticket"
    const job = new Job({
      userId: userId,
      platforms: user.selectedPlatforms || ['email', 'blog'],
      originalContent: prompt,
      status: 'processing' // Start as processing
    });
    await job.save();

    // 3. Tell the "Kitchen" to start cooking... AND WAIT!
    //    We added "await" here. This means this function will
    //    pause for 5-10 seconds until the AI is finished.
    await processContentBackground(job._id, prompt, user);

    // 4. Get the finished job from the database
    //    (The "kitchen" function updated it)
    const finishedJob = await Job.findById(job._id);

    // 5. Give the user the FULL job (with all the content)
    //    Now the user gets the content in the very first response.
    res.json({
      success: true,
      message: 'Content generated successfully!',
      job: finishedJob // <-- Send the whole job back
    });

  } catch (error) {
    console.error(error);
    // If the AI fails, the "kitchen" will update the job.
    // Let's find that job to send the error message.
    const failedJob = await Job.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(500).json({ 
      message: 'Server Error or AI Failed', 
      error: error.message,
      job: failedJob // Send the job with the error status
    });
  }
};

/**
 * 👨‍🍳 PART 2: THE "KITCHEN" (Does the slow work)
 * This function is PERFECT. No changes needed.
 * It uses JSON Mode and is very reliable.
 */
const processContentBackground = async (jobId, prompt, user) => {
  try {
// 1. Build the detailed instructions for the Gemini AI
    const fullPrompt = `
      You are an expert content creator...
      Company Name: ${user.companyName}
      Industry: ${user.industry}
      Brand Voice: ${user.brandVoice?.tone || 'professional'}
      
      Generate content for these platforms: ${user.selectedPlatforms?.join(', ')}
      Based on this user prompt:
      ${prompt}
      
      You MUST return *ONLY* a valid JSON object.
      The keys of the object MUST EXACTLY MATCH the platform names requested.
      Do not change the platform names (e.g., use "blog", not "blog_post").
      
      Example format:
      {
        "twitter": ["tweet 1", "tweet 2"],
        "linkedin": ["professional post content"],
        "email": {"subject": "Email Subject", "body": "Email body content"},
        "blog": {"title": "Blog Title", "content": "Blog post content"}
      }
    `;

    // 2. Call the Gemini AI (with JSON Mode)
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    if (!data.candidates || !data.candidates.length) {
      throw new Error('Failed to generate content from Gemini (no candidates)');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    let generatedContent;
    try {
      generatedContent = JSON.parse(generatedText);
    } catch (parseError) {
      console.error("JSON parsing failed (even in JSON mode):", parseError, "Text was:", generatedText);
      throw new Error('AI returned invalid JSON.');
    }

    // 4. Update the "Job Ticket" with the finished content
    await Job.findByIdAndUpdate(jobId, {
      status: 'completed',
      generatedContent: generatedContent,
      completedAt: new Date()
    });

    console.log(`Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    // 5. If it fails, update the ticket with an error
    await Job.findByIdAndUpdate(jobId, {
      status: 'failed',
      error: error.message
    });
    // This 'throw' is important! It tells "generateContent" that something failed.
    throw error; 
  }
};

/**
 * 🕵️‍♂️ PART 3: THE "CHECKUP" (Lets the user check their ticket)
 * We don't need this function for the "simple" way,
 * but it's good to keep for later!
 */
const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const job = await Job.findOne({ _id: jobId, userId: userId });
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json({
      success: true,
      job: job // Send the full job object
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export all our functions
module.exports = {
  generateContent,
  getJobStatus // You can still keep this route if you want
};