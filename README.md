# দেশি ভাষা সেতু — আঞ্চলিক বাংলা অনুবাদক

বাংলাদেশের ৬৪ জেলার কথ্যরীতি ও আঞ্চলিক বাংলা থেকে প্রমিত বাংলা, ইংরেজি এবং বেছে নেওয়া ভাষায় অনুবাদের জন্য responsive web app। এটি phonetic spelling ও ভুল বানান বিবেচনায় নিয়ে কথ্য অর্থ, আবেগ এবং সাংস্কৃতিক ইঙ্গিতসহ অনুবাদ তৈরি করে।

## চালু করুন

প্রয়োজন: Node.js 18 বা তার পরের সংস্করণ।

1. এই ফোল্ডারে টার্মিনাল খুলুন।
2. `.env.example` কপি করে `.env` নাম দিন।
3. Google AI Studio থেকে Gemini API key তৈরি করে `.env` ফাইলে `GEMINI_API_KEY`-এ যোগ করুন। চাইলে `GEMINI_MODEL` পরিবর্তন করুন।
4. চালান:

   ```bash
   npm start
   ```
   ```git remote add origin https://github.com/muradhosenrafi/deshi-bhasha-AI-Powered.git```

5. ব্রাউজারে `[http://localhost:3000](https://deshi-bhasha-setu.muradhosenrafi.chatgpt.site/)` খুলুন।

এখানে কোনো npm dependency নেই; Node-এর built-in HTTP ও fetch ব্যবহার করা হয়েছে। API key কেবল সার্ভারের `.env`-এ রাখুন, frontend-এ নয়। API key ছাড়া পেজ দেখা যাবে, তবে অনুবাদ endpoint অনুবাদ চালাবে না। Gemini free tier-এর quota এবং data-use শর্ত প্রযোজ্য; sensitive text পাঠাবেন না।

## সুবিধা

- ৮ বিভাগের dropdown-এ বাংলাদেশের সব ৬৪ জেলা
- জেলা বেছে দেওয়া বা automatic dialect inference
- প্রমিত বাংলা, natural English ও পছন্দের target language
- শব্দ/বাক্যাংশের ব্যাখ্যা এবং কথার সুর/সাংস্কৃতিক context
- উদাহরণে ভরা, responsive interface; copy, clear ও Ctrl/⌘ + Enter সমর্থন
- Chrome বা Edge-এ বাংলা voice input
- `/api/health` endpoint দিয়ে server configuration দেখা যায় (API key কখনো দেখায় না)

## Voice input

Chrome বা Edge-এ **কথা বলে লিখুন** বাটনে চাপুন, মাইক্রোফোন ব্যবহারের অনুমতি দিন, তারপর বাংলায় বলুন। কথা শেষ হলে **শোনা থামান** চাপুন, লেখা যাচাই করুন, তারপর **অনুবাদ করুন** চাপুন। Browser support ভিন্ন হতে পারে; voice recognition-এর জন্য internet লাগতে পারে। `localhost` বা HTTPS-এ চালিয়ে browser microphone permission দিন। Browser-এর speech-recognition service কথাকে text করে; সেই text-টাই Gemini-তে অনুবাদের জন্য পাঠানো হয়।

## API endpoint

`POST /api/translate`

```json
{
  "text": "তুঁই কই যাইতাছস?",
  "district": "নোয়াখালী",
  "targetLanguage": "English"
}
```

সফল হলে structured `translation` object ফেরত আসে। জেলা কথ্যরীতি কোনো প্রশাসনিক সীমানায় একরকম হয় না; অস্পষ্ট input-এ app অনিশ্চয়তা জানায়।
