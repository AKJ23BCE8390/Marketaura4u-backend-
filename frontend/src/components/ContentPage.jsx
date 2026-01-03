import React, { useState } from "react";
import {
  Copy,
  Check,
  Twitter,
  Linkedin,
  Mail,
  FileText,
  Loader2,
  Save,
} from "lucide-react";

/* =======================
   Content Card
======================= */
const ContentCard = ({ title, icon: Icon, content, colorClass, imageUrl }) => {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const extractText = () => {
    // Twitter (array)
    if (Array.isArray(content)) {
      return content[0]?.text || "";
    }

    // Email (object)
    if (typeof content === "object") {
      return `Subject: ${content.subject}\n\n${content.body}`;
    }

    // Blog / LinkedIn (string)
    return content;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div
        className={`px-4 py-3 border-b flex justify-between items-center ${colorClass} bg-opacity-10`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${colorClass} text-white`}>
            <Icon size={16} />
          </div>
          <h3 className="font-semibold text-sm uppercase text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>

        <button onClick={handleCopy}>
          {copied ? (
            <Check size={16} className="text-green-500" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 flex-grow">
        <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
          {Array.isArray(content) ? (
            content[0]?.text
          ) : typeof content === "object" ? (
            <>
              <p className="font-semibold mb-2">{content.subject}</p>
              {content.body}
            </>
          ) : (
            content
          )}
        </div>

        {/* ✅ IMAGE FIX */}
        {imageUrl && (
         <img
  src={imageUrl}
  alt="Generated marketing visual"
  className="w-full h-48 object-cover rounded-lg border"
  referrerPolicy="no-referrer"
  crossOrigin="anonymous"
  loading="lazy"
/>

        )}
      </div>
    </div>
  );
};

/* =======================
   Main Page
======================= */
function ContentPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* -------- Generate Content -------- */
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setData(null);

    try {
      const res = await fetch(
        "http://localhost:5000/api/v1/content/generate",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setData(json.job.generatedContent);
    } catch (err) {
      setError(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  /* -------- Save Campaign -------- */
  const handleSaveCampaign = async () => {
    if (!data) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(
        "http://localhost:5000/api/v1/campaign/save",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: prompt.slice(0, 60),
            prompt,
            content: {
              twitter: data.twitter,
              linkedin: data.linkedin,
              blog: data.blog,
              email: data.email,
            },
            // ✅ FIXED IMAGE SOURCE
            imageUrl: data.twitter?.[0]?.image_url || null,
          }),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setSuccess("Campaign saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">
            AI Content <span className="text-blue-600">Studio</span>
          </h1>
          <p className="text-slate-500 mt-2">
            Generate a full campaign from one idea.
          </p>
        </div>

        {/* Input */}
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-4 rounded-xl border dark:border-slate-700"
            placeholder="e.g. Launch campaign for eco-friendly bottles"
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Save */}
        {data && (
          <div className="flex justify-center">
            <button
              onClick={handleSaveCampaign}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Campaign
                </>
              )}
            </button>
          </div>
        )}

        {/* Messages */}
        {error && <p className="text-center text-red-500">{error}</p>}
        {success && <p className="text-center text-green-500">{success}</p>}

        {/* Results */}
        {data && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContentCard
              title="Twitter"
              icon={Twitter}
              content={data.twitter}
              imageUrl={data.twitter?.[0]?.image_url}
              colorClass="bg-sky-500"
            />
            <ContentCard
              title="LinkedIn"
              icon={Linkedin}
              content={data.linkedin}
              colorClass="bg-blue-700"
            />
            <ContentCard
              title="Email"
              icon={Mail}
              content={data.email}
              colorClass="bg-emerald-500"
            />
            <ContentCard
              title="Blog"
              icon={FileText}
              content={data.blog}
              colorClass="bg-orange-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentPage;
