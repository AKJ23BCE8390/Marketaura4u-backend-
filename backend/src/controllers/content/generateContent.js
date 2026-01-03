const User = require('../../models/user');
const Job = require('../../models/Job');

// ===============================================================
// 🛎️ PART 1: THE "WAITER"
// ===============================================================

const generateContent = async (req, res) => {
  console.log("🚀 generateContent HIT");
  console.log("REQ.USER:", req.user);

  let jobId = null;

  try {
    const { prompt } = req.body;

    // 🔐 Auth & Validation
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const brand = user.brandProfile || {};

    console.log(
      `[Log 1] User ${userId} requested content: "${prompt.slice(0, 40)}..."`
    );

    // 📦 Create Job
    const job = new Job({
      userId,
      platforms: brand.platforms?.length
        ? brand.platforms
        : ['email', 'blog', 'twitter', 'linkedin'],
      originalContent: prompt,
      status: 'processing',
    });

    await job.save();
    jobId = job._id;

    console.log(`[Log 2] Job ${jobId} created`);

    // 🍳 Process content synchronously (for now)
    await processContentBackground(jobId, prompt, brand);

    console.log(`[Log 3] Job ${jobId} completed`);

    const finishedJob = await Job.findById(jobId);
    if (!finishedJob) {
      throw new Error('Job missing after completion');
    }

    res.status(200).json({
      success: true,
      message: 'Content generated successfully',
      job: finishedJob,
    });

  } catch (error) {
    console.error(`[CATCH] Job ${jobId} failed:`, error.message);

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        status: 'failed',
        error: error.message,
      }).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: 'Content generation failed',
      error: error.message,
    });
  }
};

// ===============================================================
// 👨‍🍳 PART 2: THE "KITCHEN"
// ===============================================================

const processContentBackground = async (jobId, prompt, brand) => {
  try {
    // 🧠 Build AI Prompt
    const fullPrompt = `
You are an expert content marketing AI.

Company Name: ${brand.companyName || 'Our Company'}
Industry: ${brand.industry || 'General'}
Brand Tone: ${brand.brandVoice?.tone || 'Professional'}

TASK:
Generate marketing content based on this prompt:
"${prompt}"

OUTPUT RULES:
- Return ONLY raw JSON
- No markdown
- No explanations

JSON FORMAT:
{
  "twitter": "Short tweet (max 280 chars)",
  "linkedin": "Professional LinkedIn post",
  "email": { "subject": "Subject", "body": "Email body" },
  "blog": "One paragraph blog intro"
}
`;

    console.log(`[Kitchen] Calling Gemini for Job ${jobId}`);

    // 🤖 Gemini API
    const textResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!textResponse.ok) {
      const err = await textResponse.text();
      throw new Error(`Gemini failed: ${err}`);
    }

    const textData = await textResponse.json();
    const rawText = textData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini returned empty content');
    }

    let generatedContent;
    try {
      generatedContent = JSON.parse(rawText);
    } catch {
      throw new Error('Invalid JSON from Gemini');
    }

    // 🖼️ Generate Image (URL only)
    console.log(`[Kitchen] Generating image for Job ${jobId}`);

    const imagePrompt = `modern marketing image for ${
      brand.industry || 'business'
    }, ${prompt}, professional, high quality`;

    const encodedPrompt = encodeURIComponent(imagePrompt);
    const seed = Math.floor(Math.random() * 100000);

    const pollinationsUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=zimage&width=1024&height=1024&seed=${seed}&enhance=false`;


    const imageResponse = await fetch(pollinationsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
    });

    console.log("[Kitchen] Pollinations URL:", imageResponse.url);
    // 🐦 Normalize Twitter content (CRITICAL)
    generatedContent.twitter = [
      {
        text: generatedContent.twitter,
        image_url: imageResponse.url,
      },
    ];

    // 💾 Save Job
    await Job.findByIdAndUpdate(jobId, {
      status: 'completed',
      generatedContent,
      completedAt: new Date(),
    });

    console.log(`[Kitchen] Job ${jobId} saved successfully`);

  } catch (error) {
    console.error(`[Kitchen FAILED] Job ${jobId}:`, error.message);
    throw error;
  }
};

module.exports = {
  generateContent,
};