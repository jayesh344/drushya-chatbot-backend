# Drushya Chatbot — Backend

Ye chhota backend server tumhare chatbot ke liye API key ko safely (server pe)
hold karta hai. Isse tumhara chatbot file/GitHub/kisi ko bhi bhejo, ya real
website pe daalo — chat hamesha kaam karegi.

## Ek baar ka setup (15-20 min)

### Step 1 — Anthropic API key lo
1. https://console.anthropic.com pe jaake signup karo
2. "API Keys" section mein jaake ek naya key banao (starts with `sk-ant-...`)
3. Isko safe rakho, kisi ko mat bhejo, GitHub pe kabhi commit mat karo

### Step 2 — Is backend ko GitHub pe daalo
1. GitHub pe naya repository banao, jaise `drushya-chatbot-backend`
2. Is `drushya-backend` folder ke andar ki saari files (server.js,
   package.json, .gitignore, README.md — `.env` file NAHI, wo kabhi commit
   mat karna) usme upload/push kar do

### Step 3 — Render.com pe free deploy karo
1. https://render.com pe GitHub se signup karo
2. "New +" → "Web Service" pe click karo
3. Apna GitHub repo select karo
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. "Environment" section mein ek naya environment variable add karo:
   - Key: `ANTHROPIC_API_KEY`
   - Value: apni real key (jo Step 1 mein banayi thi)
6. "Create Web Service" pe click karo
7. Kuch minute mein Render ek live URL degi, jaisa:
   `https://drushya-chatbot-backend.onrender.com`

### Step 4 — Frontend ko backend se jodo
1. `drushya-chatbot.html` file kholo (code editor mein)
2. `BACKEND_URL` wali line dhundo (upar hi hai, `PHONE_INTL` ke neeche)
3. Usme apna Render URL daal do, `/api/chat` ke saath, jaise:
   ```js
   const BACKEND_URL = "https://drushya-chatbot-backend.onrender.com/api/chat";
   ```
4. File save karo — ab chatbot kahi bhi bhejo, chat kaam karegi!

## Local testing (optional, apni machine pe check karne ke liye)

```bash
cd drushya-backend
npm install
cp .env.example .env
# .env file mein apni real ANTHROPIC_API_KEY daal do
npm start
```

Server `http://localhost:3000` pe chalega. Health check ke liye:
`http://localhost:3000/health`

## Important notes

- Free Render plan thoda "sleep" ho jaata hai agar 15 min tak koi use na kare
  — pehla message thoda slow (10-20 sec) aa sakta hai jab wapas "wake up" ho
  raha ho. Ye normal hai.
- Rate limiting already lagi hai (30 messages per IP / 15 min) taaki koi bhi
  spam na kar sake aur API bill control mein rahe.
- Agar chahiye to CORS ko apni real website ke domain tak restrict kar sakte
  ho `server.js` mein (`app.use(cors())` line ko edit karke) — abhi ke liye
  testing ke liye sab origins allowed hain.
