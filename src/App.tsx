import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  ShieldCheck, 
  Wallet,
  Languages,
  ArrowRight,
  RefreshCcw,
  User,
  Calendar,
  Briefcase,
  IndianRupee,
  PiggyBank,
  CreditCard,
  Home
} from 'lucide-react';

// --- Types ---

type Language = 'English' | 'Hindi' | 'Marathi' | 'Kannada' | 'Urdu';

interface Step {
  id: string;
  question: Record<Language, string>;
  field: keyof FormData;
  type: 'text' | 'number' | 'choice';
}

interface FormData {
  fullName: string;
  age: string;
  employmentStatus: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  savings: string;
  existingLoans: string;
  assets: string;
}

interface PredictionResult {
  status: 'Approved' | 'Rejected';
  riskLevel: 'Low' | 'Moderate' | 'High';
  creditScore: number;
  suggestedAmount: string;
  reasons?: string[];
  details: {
    disposableIncome: number;
    stabilityScore: string;
  };
}

// --- Constants ---

const LANGUAGES: Language[] = ['English', 'Hindi', 'Marathi', 'Kannada', 'Urdu'];

const STEPS: Step[] = [
  {
    id: 'fullName',
    field: 'fullName',
    type: 'text',
    question: {
      English: "What is your full name?",
      Hindi: "आपका पूरा नाम क्या है?",
      Marathi: "तुमचे पूर्ण नाव काय आहे?",
      Kannada: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?",
      Urdu: "آپ کا پورا نام کیا ہے؟"
    }
  },
  {
    id: 'age',
    field: 'age',
    type: 'number',
    question: {
      English: "How old are you?",
      Hindi: "आपकी उम्र क्या है?",
      Marathi: "तुमचे वय किती आहे?",
      Kannada: "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
      Urdu: "آپ کی عمر کیا ہے؟"
    }
  },
  {
    id: 'employmentStatus',
    field: 'employmentStatus',
    type: 'choice',
    question: {
      English: "What is your employment status? Salaried, Self-employed, or Unemployed?",
      Hindi: "आपकी रोजगार स्थिति क्या है? वेतनभोगी, स्व-नियोजित, या बेरोजगार?",
      Marathi: "तुमची रोजगाराची स्थिती काय आहे? पगारदार, स्वयंरोजगार की बेरोजगार?",
      Kannada: "ನಿಮ್ಮ ಉದ್ಯೋಗ ಸ್ಥಿತಿ ಏನು? ಸಂಬಳ ಪಡೆಯುವವರು, ಸ್ವಯಂ ಉದ್ಯೋಗಿಗಳು ಅಥವಾ ನಿರುದ್ಯೋಗಿಗಳು?",
      Urdu: "آپ کی ملازمت کی حیثیت کیا ہے؟ تنخواہ دار، خود روزگار، یا بے روزگار؟"
    }
  },
  {
    id: 'monthlyIncome',
    field: 'monthlyIncome',
    type: 'number',
    question: {
      English: "What is your monthly income in Rupees?",
      Hindi: "आपकी मासिक आय रुपयों में कितनी है?",
      Marathi: "तुमचे मासिक उत्पन्न रुपयांमध्ये किती आहे?",
      Kannada: "ರೂಪಾಯಿಗಳಲ್ಲಿ ನಿಮ್ಮ ಮಾಸಿಕ ಆದಾಯ ಎಷ್ಟು?",
      Urdu: "روپوں میں آپ کی ماہانہ آمدنی کیا ہے؟"
    }
  },
  {
    id: 'monthlyExpenses',
    field: 'monthlyExpenses',
    type: 'number',
    question: {
      English: "What are your average monthly expenses?",
      Hindi: "आपके औसत मासिक खर्च क्या हैं?",
      Marathi: "तुमचा सरासरी मासिक खर्च किती आहे?",
      Kannada: "ನಿಮ್ಮ ಸರಾಸರಿ ಮಾಸಿಕ ವೆಚ್ಚಗಳು ಯಾವುವು?",
      Urdu: "آپ کے اوسط ماہانہ اخراجات کیا ہیں؟"
    }
  },
  {
    id: 'savings',
    field: 'savings',
    type: 'number',
    question: {
      English: "How much total savings do you have?",
      Hindi: "आपके पास कुल कितनी बचत है?",
      Marathi: "तुमच्याकडे एकूण किती बचत आहे?",
      Kannada: "ನಿಮ್ಮಲ್ಲಿ ಒಟ್ಟು ಎಷ್ಟು ಉಳಿತಾಯವಿದೆ?",
      Urdu: "آپ کے پاس کل کتنی بچت ہے؟"
    }
  },
  {
    id: 'existingLoans',
    field: 'existingLoans',
    type: 'number',
    question: {
      English: "What is the total amount of your existing loans?",
      Hindi: "आपके मौजूदा ऋणों की कुल राशि क्या है?",
      Marathi: "तुमच्या विद्यमान कर्जाची एकूण रक्कम किती आहे?",
      Kannada: "ನಿಮ್ಮ ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಸಾಲಗಳ ಒಟ್ಟು ಮೊತ್ತ ಎಷ್ಟು?",
      Urdu: "آپ کے موجودہ قرضوں کی کل رقم کیا ہے؟"
    }
  },
  {
    id: 'assets',
    field: 'assets',
    type: 'text',
    question: {
      English: "Do you have any major assets like property or gold?",
      Hindi: "क्या आपके पास संपत्ति या सोने जैसी कोई बड़ी संपत्ति है?",
      Marathi: "तुमच्याकडे मालमत्ता किंवा सोन्यासारखी कोणतीही मोठी मालमत्ता आहे का?",
      Kannada: "ನಿಮ್ಮಲ್ಲಿ ಆಸ್ತಿ ಅಥವಾ ಚಿನ್ನದಂತಹ ಯಾವುದೇ ಪ್ರಮುಖ ಆಸ್ತಿಗಳಿವೆಯೇ?",
      Urdu: "کیا آپ کے پاس جائیداد یا سونے جیسے کوئی بڑے اثاثے ہیں؟"
    }
  }
];

// --- Components ---

export default function App() {
  const [appState, setAppState] = useState<'welcome' | 'language' | 'chat' | 'result'>('welcome');
  const [language, setLanguage] = useState<Language>('English');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 for language selection
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    employmentStatus: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    savings: '',
    existingLoans: '',
    assets: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  
  // Use refs to avoid stale closures in event handlers
  const stateRef = useRef({ appState, language, currentStepIndex, formData });
  useEffect(() => {
    stateRef.current = { appState, language, currentStepIndex, formData };
  }, [appState, language, currentStepIndex, formData]);

  // --- Voice Logic ---

  const speak = useCallback((text: string, onEnd?: () => void, langOverride?: Language) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = langOverride || stateRef.current.language;
    
    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (targetLang === 'Hindi') {
        utterance.voice = voices.find(v => v.lang.startsWith('hi')) || null;
        utterance.lang = 'hi-IN';
      } else if (targetLang === 'Marathi') {
        utterance.voice = voices.find(v => v.lang.startsWith('mr')) || null;
        utterance.lang = 'mr-IN';
      } else if (targetLang === 'Urdu') {
        utterance.voice = voices.find(v => v.lang.startsWith('ur')) || null;
        utterance.lang = 'ur-PK';
      } else if (targetLang === 'Kannada') {
        utterance.voice = voices.find(v => v.lang.startsWith('kn')) || null;
        utterance.lang = 'kn-IN';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = doSpeak;
    } else {
      doSpeak();
    }
  }, []);

  const startListening = useCallback(() => {
    const tryStart = (attempts = 0) => {
      if (!recognitionRef.current) {
        if (attempts < 10) {
          setTimeout(() => tryStart(attempts + 1), 100);
        }
        return;
      }
      
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            // Check if the recognition language matches the current state language
            const langMap: Record<Language, string> = {
              'English': 'en-US', 'Hindi': 'hi-IN', 'Marathi': 'mr-IN', 'Kannada': 'kn-IN', 'Urdu': 'ur-IN'
            };
            const expectedLang = langMap[stateRef.current.language] || 'en-US';
            
            if (recognitionRef.current.lang !== expectedLang && attempts < 5) {
              console.log("Lang mismatch, waiting for effect...", recognitionRef.current.lang, expectedLang);
              setTimeout(() => tryStart(attempts + 1), 200);
              return;
            }

            recognitionRef.current.start();
            setIsListening(true);
            setTranscript('');
          } catch (e) {
            console.error("Start error:", e);
          }
        }, 150);
      } catch (e) {
        console.error("Stop/Start error:", e);
      }
    };

    tryStart();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // --- App Logic ---

  const handleUserResponse = useCallback(async (text: string) => {
    const { appState: currentAppState, language: currentLang, currentStepIndex: currentIndex, formData: currentData } = stateRef.current;
    
    // Clean numeric input if the current step expects a number
    let processedText = text;
    const currentStep = currentIndex >= 0 ? STEPS[currentIndex] : null;
    if (currentStep && currentStep.type === 'number') {
      // Remove currency symbols, commas, and non-numeric characters except decimal point
      processedText = text.replace(/[^0-9.]/g, '');
      if (processedText === '') processedText = text; // Fallback to original if completely stripped
    }

    console.log("User said:", text, "Processed:", processedText, "State:", currentAppState);
    setChatHistory(prev => [...prev, { role: 'user', text }]);
    setRetryCount(0);

    if (currentAppState === 'language') {
      // More robust language detection including native scripts
      const lowerText = text.toLowerCase();
      let detectedLang: Language | null = null;
      
      if (lowerText.includes('hindi') || lowerText.includes('हिंदी')) detectedLang = 'Hindi';
      else if (lowerText.includes('english')) detectedLang = 'English';
      else if (lowerText.includes('marathi') || lowerText.includes('मराठी')) detectedLang = 'Marathi';
      else if (lowerText.includes('kannada') || lowerText.includes('ಕನ್ನಡ')) detectedLang = 'Kannada';
      else if (lowerText.includes('urdu') || lowerText.includes('اردو')) detectedLang = 'Urdu';

      if (detectedLang) {
        console.log("Detected language:", detectedLang);
        setLanguage(detectedLang);
        setAppState('chat');
        setCurrentStepIndex(0);
        
        const nextStep = STEPS[0];
        const question = nextStep.question[detectedLang];
        setChatHistory(prev => [...prev, { role: 'ai', text: question }]);
        
        // Use the detected language directly for the first question to avoid state lag
        speak(question, () => {
          startListening();
        }, detectedLang);
      } else {
        speak("I didn't recognize that language. Please choose from Hindi, English, Marathi, Kannada, or Urdu.", () => {
          startListening();
        });
      }
      return;
    }

    if (currentAppState === 'chat') {
      const currentStep = STEPS[currentIndex];
      
      // Basic validation for age
      if (currentStep.field === 'age') {
        const ageVal = parseInt(processedText);
        if (!isNaN(ageVal) && ageVal < 18) {
          const warningText = currentLang === 'English' 
            ? "I noticed you're under 18. Please note that you must be at least 18 to be eligible for a loan, but we can continue the assessment for demonstration purposes." 
            : "मैंने देखा कि आपकी उम्र 18 वर्ष से कम है। कृपया ध्यान दें कि ऋण के लिए पात्र होने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए, लेकिन हम प्रदर्शन के उद्देश्यों के लिए मूल्यांकन जारी रख सकते हैं।";
          
          setChatHistory(prev => [...prev, { role: 'ai', text: warningText }]);
          speak(warningText, () => {
            // After warning, proceed to next step
            proceedToNextStep(processedText);
          });
          return;
        }
      }

      proceedToNextStep(processedText);
    }
  }, [speak, startListening]);

  const proceedToNextStep = (text: string) => {
    const { language: currentLang, currentStepIndex: currentIndex, formData: currentData } = stateRef.current;
    const currentStep = STEPS[currentIndex];
    const updatedData = { ...currentData, [currentStep.field]: text };
    
    // Update form data state
    setFormData(updatedData);

    // Move to next step or finish
    if (currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = STEPS[nextIndex];
      const question = nextStep.question[currentLang];
      setChatHistory(prev => [...prev, { role: 'ai', text: question }]);
      speak(question, () => {
        startListening();
      });
    } else {
      finishApplication(updatedData);
    }
  };

  const finishApplication = async (updatedData: FormData) => {
    const { language: currentLang } = stateRef.current;
    setIsProcessing(true);
    const processingText = currentLang === 'English' ? "Thank you. Processing your application now." : "धन्यवाद। अब आपके आवेदन पर कार्रवाई की जा रही है।";
    setChatHistory(prev => [...prev, { role: 'ai', text: processingText }]);
    speak(processingText);
    
    // Call Backend API with the LATEST data
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: updatedData.monthlyIncome,
          expenses: updatedData.monthlyExpenses,
          savings: updatedData.savings,
          existingLoans: updatedData.existingLoans,
          assets: updatedData.assets,
          age: updatedData.age
        })
      });
      const data = await response.json();
      setResult(data);
      setAppState('result');
      
      let resultText = "";
      if (data.status === 'Approved') {
        resultText = currentLang === 'English' 
          ? `Congratulations! Your loan is approved. Your credit score is ${data.creditScore}, and your risk level is ${data.riskLevel}. We suggest a loan amount of up to ${data.suggestedAmount}.` 
          : `बधाई हो! आपका ऋण स्वीकृत हो गया है। आपका क्रेडिट स्कोर ${data.creditScore} है, और आपका जोखिम स्तर ${data.riskLevel} है। हम ${data.suggestedAmount} तक की ऋण राशि का सुझाव देते हैं।`;
      } else {
        const reasonsText = data.reasons && data.reasons.length > 0 
          ? (currentLang === 'English' ? ` The reasons for rejection are: ${data.reasons.join(" ")}` : ` अस्वीकृति के कारण हैं: ${data.reasons.join(" ")}`)
          : "";
        
        resultText = currentLang === 'English' 
          ? `I'm sorry, your loan application was rejected. Your credit score is ${data.creditScore}.${reasonsText}` 
          : `क्षमा करें, आपका ऋण आवेदन अस्वीकार कर दिया गया था। आपका क्रेडिट स्कोर ${data.creditScore} है।${reasonsText}`;
      }
      
      speak(resultText);
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Set language code
      const langMap: Record<Language, string> = {
        'English': 'en-US',
        'Hindi': 'hi-IN',
        'Marathi': 'mr-IN',
        'Kannada': 'kn-IN',
        'Urdu': 'ur-IN'
      };
      recognition.lang = langMap[language] || 'en-US';

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleUserResponse(text);
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        console.error("Recognition error event:", error);
        setIsListening(false);
        
        if (error === 'no-speech') {
          // If it's a no-speech error, we try to restart silently first
          // to maintain the "automatic" feel without annoying the user
          const currentRetry = retryCount;
          if (currentRetry < 3) {
            setRetryCount(prev => prev + 1);
            console.log(`Silent retry ${currentRetry + 1} for no-speech...`);
            // Small delay before restarting to avoid rapid-fire errors
            setTimeout(() => {
              startListening();
            }, 300);
          } else {
            // After 3 silent retries, we prompt the user
            setRetryCount(0); // Reset for the next prompt
            const retryText = stateRef.current.language === 'English' 
              ? "I'm still here. Please tell me your answer when you're ready." 
              : "मैं अभी भी यहीं हूँ। जब आप तैयार हों, तो कृपया मुझे अपना उत्तर बताएं।";
            
            speak(retryText, () => {
              startListening();
            });
          }
        } else if (error === 'not-allowed' || error === 'service-not-allowed') {
          speak(stateRef.current.language === 'English' 
            ? "Microphone access is required. Please check your browser settings." 
            : "माइक्रोफ़ोन एक्सेस आवश्यक है। कृपया अपनी ब्राउज़र सेटिंग्स जांचें।");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, retryCount, speak, startListening, handleUserResponse]);

  const handleDemoMode = () => {
    const demoData: FormData = {
      fullName: 'John Doe',
      age: '30',
      employmentStatus: 'Salaried',
      monthlyIncome: '50000',
      monthlyExpenses: '15000',
      savings: '200000',
      existingLoans: '5000',
      assets: 'House, Gold'
    };
    
    setFormData(demoData);
    setLanguage('English');
    setAppState('chat');
    setCurrentStepIndex(STEPS.length - 1);
    
    // Update chat history to show the demo flow
    setChatHistory([
      { role: 'ai', text: "Welcome! Let's run a demo application." },
      { role: 'user', text: "I'm ready." },
      { role: 'ai', text: STEPS[STEPS.length - 1].question['English'] },
      { role: 'user', text: demoData.assets }
    ]);

    // Directly trigger the final processing with the demo data
    setTimeout(() => {
      finishApplication(demoData);
    }, 500);
  };

  const resetApp = () => {
    setAppState('welcome');
    setFormData({
      fullName: '',
      age: '',
      employmentStatus: '',
      monthlyIncome: '',
      monthlyExpenses: '',
      savings: '',
      existingLoans: '',
      assets: ''
    });
    setCurrentStepIndex(-1);
    setChatHistory([]);
    setResult(null);
  };

  const handleStart = () => {
    setAppState('language');
    const welcomeText = "Welcome to VoiceCredit AI. Please select your language: Hindi, English, Marathi, Kannada, or Urdu.";
    setChatHistory([{ role: 'ai', text: welcomeText }]);
    speak(welcomeText, () => {
      startListening();
    }, 'English');
  };

  // --- Render Helpers ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20"
      >
        <ShieldCheck className="w-16 h-16 text-white" />
      </motion.div>
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">VoiceCredit AI</h1>
        <p className="text-xl text-slate-500 max-w-md mx-auto">
          Experience the future of banking with our multilingual, voice-driven loan approval system.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={handleStart}
          aria-label="Start Voice Application"
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-lg shadow-lg transition-all flex items-center gap-2 group"
        >
          Start Voice Application
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          onClick={handleDemoMode}
          aria-label="Demo Mode Auto-fill"
          className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 rounded-2xl font-semibold text-lg transition-all"
        >
          Demo Mode (Auto-fill)
        </button>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Languages className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Language</p>
            <p className="font-semibold text-slate-700">{language}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-red-100 animate-pulse' : 'bg-slate-100'}`}>
            {isListening ? <Mic className="w-5 h-5 text-red-600" /> : <MicOff className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
            <p className={`font-semibold ${isListening ? 'text-red-600' : 'text-slate-700'}`}>
              {isListening ? 'Listening...' : 'Waiting...'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          <AnimatePresence initial={false}>
            {chatHistory.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'ai' 
                    ? 'bg-slate-100 text-slate-800 rounded-tl-none' 
                    : 'bg-emerald-600 text-white rounded-tr-none'
                }`}>
                  <p className="text-sm font-medium">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          {transcript && (
            <div className="mb-2 px-4 py-2 bg-white rounded-xl border border-emerald-100 text-emerald-700 text-sm italic">
              " {transcript} "
            </div>
          )}
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type your answer here if voice fails..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleUserResponse(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button 
              onClick={() => isListening ? stopListening() : startListening()}
              className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!result) return null;

    const isApproved = result.status === 'Approved';

    return (
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${isApproved ? 'bg-emerald-100' : 'bg-red-100'}`}
          >
            {isApproved ? <CheckCircle className="w-12 h-12 text-emerald-600" /> : <XCircle className="w-12 h-12 text-red-600" />}
          </motion.div>
          <h2 className={`text-4xl font-bold ${isApproved ? 'text-emerald-700' : 'text-red-700'}`}>
            Loan {result.status}
          </h2>
          {!isApproved && result.reasons && result.reasons.length > 0 && (
            <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm text-left">
              <p className="font-bold mb-2">Rejection Reasons:</p>
              <ul className="list-disc list-inside space-y-1">
                {result.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-slate-500">Based on your financial profile and stability assessment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Credit Score</span>
            </div>
            <p className="text-4xl font-bold text-slate-900">{result.creditScore}</p>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${result.creditScore > 700 ? 'bg-emerald-500' : result.creditScore > 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${(result.creditScore / 850) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Risk Level</span>
            </div>
            <p className={`text-4xl font-bold ${result.riskLevel === 'Low' ? 'text-emerald-600' : result.riskLevel === 'Moderate' ? 'text-yellow-600' : 'text-red-600'}`}>
              {result.riskLevel}
            </p>
            <p className="text-xs text-slate-400">Stability Score: {result.details.stabilityScore}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Suggested Loan</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{result.suggestedAmount}</p>
            <p className="text-xs text-slate-400">Max eligibility limit</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Application Summary</h3>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{formData.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{formData.age} Years</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">{formData.employmentStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  <span className="text-sm">₹{formData.monthlyIncome}/mo</span>
                </div>
              </div>
            </div>
            <button 
              onClick={resetApp}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              New Application
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">VoiceCredit AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-emerald-600 transition-colors">How it Works</a>
          <a href="#" className="hover:text-emerald-600 transition-colors">Security</a>
          <a href="#" className="hover:text-emerald-600 transition-colors">Support</a>
          <button className="px-5 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {appState === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {renderWelcome()}
            </motion.div>
          )}
          {(appState === 'language' || appState === 'chat') && (
            <motion.div key="chat" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              {renderChat()}
            </motion.div>
          )}
          {appState === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {renderResult()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
        <p>© 2026 VoiceCredit AI. Secure & Encrypted.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-slate-600">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
