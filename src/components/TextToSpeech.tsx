import { useState, useEffect, useRef } from "react";
import { Volume2, Loader2, Copy, Check } from "lucide-react";

const languages = [
  { code: "ja", name: "Japanese" },
  { code: "zh-CN", name: "Chinese" },
  { code: "en", name: "English" },
  { code: "vi", name: "Vietnamese" },
];

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("ja");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlText = params.get("text");
    const urlLang = params.get("lang");
    const urlAuto = params.get("auto");

    if (urlText) {
      setText(urlText);
      if (urlLang && languages.find(l => l.code === urlLang)) {
        setLanguage(urlLang);
      }
      if (urlAuto === "true") {
        setAutoTranslate(true);
        setTimeout(() => playAudio(urlText, urlLang || language), 500);
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TTS_UPDATE') {
        const { text: newText, language: newLang, autoPlay } = event.data;

        if (newText !== undefined) {
          setText(newText);
        }

        if (newLang && languages.find(l => l.code === newLang)) {
          setLanguage(newLang);
        }

        if (autoPlay && newText && newText.trim()) {
          setTimeout(() => playAudio(newText, newLang), 300);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'TTS_READY' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (autoTranslate && text.trim()) {
      const timer = setTimeout(() => {
        playAudio();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [text, language, autoTranslate]);

  const playAudio = async (textToPlay?: string, langToUse?: string) => {
    const finalText = textToPlay || text;
    const finalLang = langToUse || language;

    if (!finalText.trim()) {
      setError("Please enter some text");
      return;
    }

    setIsPlaying(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: finalText, language: finalLang }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setError("Failed to play audio");
      };

      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
      setError("Failed to generate speech. Please try again.");
    }
  };

  const generateShareableUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      text: text,
      lang: language,
      auto: autoTranslate ? "true" : "false"
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateShareableUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Text to Speech
          </h1>
          <p className="text-gray-600">
            Convert text to speech in multiple languages
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to speech..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={5}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoTranslate"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoTranslate" className="text-sm text-gray-700">
              Auto-play when text changes
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={() => playAudio()}
            disabled={isPlaying || !text.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isPlaying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Playing...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                Play Audio
              </>
            )}
          </button>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Shareable URL</p>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <code className="text-xs text-gray-600 break-all">
                {generateShareableUrl()}
              </code>
            </div>
          </div>

          <div className="pt-4 space-y-3 text-xs text-gray-600">
            <div>
              <p className="font-semibold mb-2">Google Sheets Integration:</p>
              <p className="mb-1">1. Use URL format: <code className="bg-gray-100 px-2 py-1 rounded">?text=YOUR_TEXT&lang=LANG_CODE&auto=true</code></p>
              <p>2. Language codes: ja (Japanese), zh-CN (Chinese), en (English), vi (Vietnamese)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
