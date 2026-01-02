// const User = require('../../models/User'); 
// const Job = require('../../models/job');   
//  // Make sure you have `npm install node-fetch`

// // (Your 'generateContent' function goes here - no changes needed)
// const generateContent = async (req, res) => {
//   let jobId = null;
  
//   try {
//     // 1. CHECK USER AND INPUT
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }
    
//     const userId = req.user.id;
//     const { prompt } = req.body;

//     if (!prompt || prompt.trim().length < 10) {
//       return res.status(400).json({ success: false, message: 'Prompt must be at least 10 characters' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     // 2. GET USER'S PLATFORMS
//     const platformsToGenerate = user.platforms; 
//     if (!platformsToGenerate || platformsToGenerate.length === 0) {
//       return res.status(400).json({ success: false, message: 'No platforms selected' });
//     }

//     // 3. CREATE JOB IN DATABASE
//     const job = new Job({
//       userId: userId,
//       platforms: platformsToGenerate,
//       originalContent: prompt,
//       status: 'processing'
//     });
//     await job.save();
//     jobId = job._id;

//     console.log(`Job ${jobId} created for platforms: ${platformsToGenerate.join(', ')}`);

//     // 4. GENERATE CONTENT USING AI
//     const generatedContent = await callAIAndGenerateContent(jobId, prompt, user, platformsToGenerate);

//     // 5. SAVE RESULTS TO JOB
//     const finishedJob = await Job.findByIdAndUpdate(jobId, {
//       status: 'completed',
//       generatedContent: generatedContent,
//       completedAt: new Date()
//     }, { new: true });

//     // 6. SEND SUCCESS RESPONSE
//     res.status(200).json({
//       success: true,
//       message: 'Content generated successfully!',
//       job: finishedJob
//     });

//   } catch (error) {
//     console.error(`Job ${jobId} failed:`, error.message);
    
//     // MARK JOB AS FAILED IF ERROR
//     if (jobId) {
//       await Job.findByIdAndUpdate(jobId, { 
//         status: 'failed', 
//         error: error.message 
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Content generation failed',
//       error: error.message
//     });
//   }
// };


// /**
//  * -----------------------------------------------------------------
//  * THIS IS THE FIXED FUNCTION
//  * -----------------------------------------------------------------
//  */
// const callAIAndGenerateContent = async (jobId, prompt, user, platformsToGenerate) => {
  
//   // CREATE PROMPT FOR AI (No changes here, this is good)
//   const fullPrompt = `
//     Create marketing content for these platforms: ${platformsToGenerate.join(', ')}
//     Company: ${user.companyName || 'Our Company'}
//     Brand Tone: ${user.brandVoice?.tone || 'professional'}
    
//     User's Request: "${prompt}"
    
//     Return ONLY JSON format with these keys: ${platformsToGenerate.join(', ')}
    
//     For Twitter: array of tweet objects with text and image_url
//     For LinkedIn: array of post strings  
//     For Email: object with subject and body
//     For Blog: object with title and content
//     For Instagram: object with caption and image_url
//   `;

//   // ---
//   // ✅ FIX 1: Changed to the correct, modern Gemini model URL
//   // ---
//   const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
//   const response = await fetch(geminiUrl, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: fullPrompt }] }],
//       // ---
//       // ✅ FIX 2: Added back generationConfig to force JSON output
//       // This prevents your JSON.parse() from failing.
//       // ---
//       generationConfig: { 
//         responseMimeType: "application/json" 
//       }
//     })
//   });
 
//   if (!response.ok) {
//     // This will now give a more useful error if it's not a 404
//     const errText = await response.text();
//     throw new Error(`AI API Error: ${response.status} - ${errText}`);
//   }

//   const data = await response.json();
  
//   if (!data.candidates || !data.candidates[0].content) {
//     throw new Error("AI returned empty response");
//   }

//   // PARSE AI RESPONSE
//   // This will now work perfectly because of FIX 2
//   const rawText = data.candidates[0].content.parts[0].text;
//   let generatedContent = JSON.parse(rawText);

//   // ADD IMAGES IF NEEDED (No changes here, this is good)
//   const needsImage = platformsToGenerate.includes('twitter') || platformsToGenerate.includes('instagram');
  
//   if (needsImage) {
//     const imagePrompt = `professional marketing image for: ${prompt}`;
//     const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1080&height=1080`;
    
//     generatedContent.imageUrl = imageUrl;

//     // ADD IMAGE TO TWITTER AND INSTAGRAM POSTS
//     if (generatedContent.twitter && generatedContent.twitter[0]) {
//       generatedContent.twitter[0].image_url = imageUrl;
//     }
//     if (generatedContent.instagram) {
//       generatedContent.instagram.image_url = imageUrl;
//     }
//   }

//   return generatedContent;
// };

// module.exports = {
//   generateContent
// };
const User = require('../../models/user.js');
const Job = require('../../models/job');
// If you are on Node < 18, uncomment: const fetch = require('node-fetch');

// --- MAIN CONTROLLER ---
const generateContent = async (req, res) => {
  let jobId = null;

  try {
    // 1. CHECK USER AND INPUT
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length < 5) { // Lowered limit slightly for flexibility
      return res.status(400).json({ success: false, message: 'Topic is too short.' });
    }

    // 2. FETCH USER WITH BRAND PROFILE
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 3. GET PLATFORMS
    const platformsToGenerate = user.brandProfile?.platforms?.length > 0 
      ? user.brandProfile.platforms 
      : ['twitter', 'linkedin']; // Fallback

    // 4. CREATE JOB
    const job = new Job({
      userId: userId,
      platforms: platformsToGenerate,
      originalContent: prompt,
      status: 'processing'
    });
    await job.save();
    jobId = job._id;

    console.log(`Job ${jobId} started. Generating for: ${platformsToGenerate.join(', ')}`);

    // 5. GENERATE CONTENT (The Smart AI Logic)
    const generatedContent = await callAIAndGenerateContent(prompt, user, platformsToGenerate);

    // 6. UPDATE JOB & RESPOND
    const finishedJob = await Job.findByIdAndUpdate(jobId, {
      status: 'completed',
      generatedContent: generatedContent,
      completedAt: new Date()
    }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Content generated successfully!',
      job: finishedJob
    });

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error.message);
    
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, { 
        status: 'failed', 
        error: error.message 
      });
    }

    res.status(500).json({
      success: false,
      message: 'Content generation failed',
      error: error.message
    });
  }
};

/**
 * -----------------------------------------------------------------
 * SMART AI GENERATION FUNCTION
 * (Now includes UVP, Audience, and Platform-Specific Hashtag Logic)
 * -----------------------------------------------------------------
 */
const callAIAndGenerateContent = async (userPrompt, user, platforms) => {
  
  const { brandProfile } = user;

  // 1. CONSTRUCT THE "MEGA PROMPT"
  // This incorporates all the logic regarding UVP, Audience, and Hashtags
  const systemPrompt = `
    You are an expert Social Media Copywriter for "${brandProfile.companyName || 'our brand'}".
    
    --- 1. BRAND INTELLIGENCE ---
    INDUSTRY: ${brandProfile.industry || 'General Business'}
    TARGET AUDIENCE: ${brandProfile.targetAudience?.description || 'General Audience'}
       - Their Pain Point: "${brandProfile.targetAudience?.painPoint || ''}"
       - Their Desire: "${brandProfile.targetAudience?.desire || ''}"
    UNIQUE VALUE PROPOSITION (UVP): "${brandProfile.uvp || ''}"
    BRAND VOICE: ${brandProfile.brandVoice?.tone || 'Professional'} 
    EXTRA VOICE RULES: ${brandProfile.brandVoice?.description || 'Be human and engaging.'}

    --- 2. THE USER REQUEST ---
    Topic: "${userPrompt}"

    --- 3. OUTPUT INSTRUCTIONS (STRICT JSON) ---
    You must return a valid JSON object containing keys only for these platforms: ${platforms.join(', ')}.
    Follow these specific rules for each platform:

    ${platforms.includes('twitter') ? `
    "twitter": [
      { 
        "text": "Write a punchy tweet (max 280 chars). Use slang if appropriate. Include ONLY 2-3 highly specific hashtags at the end (e.g. #${brandProfile.industry.replace(/\s/g,'')} #SpecificTag). Do NOT use generic tags like #business.",
        "image_url": "Leave empty"
      }
    ],` : ''}

    ${platforms.includes('linkedin') ? `
    "linkedin": [
      "Write a professional post. Use short paragraphs and line breaks for readability. Focus on adding value to the reader. Mention our UVP naturally. End with a question to drive engagement."
    ],` : ''}

    ${platforms.includes('instagram') ? `
    "instagram": {
      "caption": "Write an engaging caption. Start with a hook. Use emojis. At the very bottom, add 15-20 hashtags mixed between Broad Industry tags (e.g. #${brandProfile.industry.replace(/\s/g,'')}) and Niche tags (e.g. #${brandProfile.targetAudience?.split(' ')[0]}Life).",
      "image_url": "Leave empty"
    },` : ''}

    ${platforms.includes('facebook') ? `
    "facebook": {
      "post": "Write a friendly, community-focused post. Keep it conversational."
    },` : ''}

    ${platforms.includes('email') ? `
    "email": {
      "subject": "Catchy subject line",
      "body": "Full email body. Focus on the pain point: ${brandProfile.targetAudience?.painPoint} and offer our solution."
    },` : ''}

    Return ONLY raw JSON. No markdown formatting.
  `;

  // 2. CALL GEMINI API
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: { 
        responseMimeType: "application/json" // Critical for parsing
      }
    })
  });
 
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0].content) {
    throw new Error("AI returned empty response");
  }

  // 3. PARSE JSON RESPONSE
  const rawText = data.candidates[0].content.parts[0].text;
  let generatedContent;
  try {
    generatedContent = JSON.parse(rawText);
  } catch (e) {
    console.error("JSON Parse Failed", rawText);
    throw new Error("AI produced invalid JSON");
  }

  // 4. IMAGE GENERATION (Pollinations.ai)
  // We generate one professional image based on the topic and inject it into the social posts
  const needsImage = platforms.some(p => ['twitter', 'instagram', 'facebook'].includes(p));
  
  if (needsImage) {
    // We encode the prompt to be URL safe
    const imagePrompt = `professional photo, ${brandProfile.industry} style, ${userPrompt}, high quality, 4k`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1080&height=1080&nologo=true`;
    
    // Inject the URL into the JSON response
    generatedContent.imageUrl = imageUrl; // Global reference

    if (generatedContent.twitter && generatedContent.twitter[0]) {
      generatedContent.twitter[0].image_url = imageUrl;
    }
    if (generatedContent.instagram) {
      generatedContent.instagram.image_url = imageUrl;
    }
    if (generatedContent.facebook) {
      generatedContent.facebook.image_url = imageUrl;
    }
  }

  return generatedContent;
};

module.exports = {
  generateContent
};