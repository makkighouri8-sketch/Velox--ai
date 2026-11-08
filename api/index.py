import os
import json
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            user_message = data.get('message', '')

            # Multiple API Keys support (Comma se alag karke jitni marzi keys daal sakte ho)
            raw_keys = os.environ.get('GEMINI_API_KEY', '')
            api_keys = [k.strip() for k in raw_keys.split(',') if k.strip()]

            if not api_keys:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "API key missing"}')
                return

            ai_reply = "Velox is getting ready, please try again."
            success = False

            # Advanced System Instructions with Strict Formatting Rules (No weird ### symbols or spacing bugs)
            system_instruction = {
                "parts": [{
                    "text": (
                        "You are Velox AI, a high-performance, intelligent AI assistant created and developed by Gulfaam Ghouri. "
                        "Whenever a user asks about your identity, name, or creator, proudly state that you are Velox AI built by Gulfaam Ghouri. "
                        "STRICT FORMATTING & LAYOUT RULES: "
                        "1. Never include random artifacts like '###', raw code tags, or broken symbols. "
                        "2. Keep spacing normal and clean. Do not add excessive line breaks or double spaces between words. "
                        "3. Always organize and format your responses for maximum readability and scannability. Avoid dense walls of text. "
                        "4. Use headings (such as ## or ###) only when organizing structured multi-part sections correctly. "
                        "5. Use bolding (**...**) judiciously to emphasize key phrases. "
                        "6. Keep your layout clean, structured, and easy to digest at a glance."
                    )
                }]
            }

            payload = json.dumps({
                "system_instruction": system_instruction,
                "contents": [
                    {
                        "parts": [{"text": user_message}]
                    }
                ]
            }).encode('utf-8')

            # Try keys one by one (Key Rotation mechanism to handle limits safely)
            for api_key in api_keys:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
                
                try:
                    with urllib.request.urlopen(req) as response:
                        res_raw = response.read().decode('utf-8', errors='ignore')
                        res_data = json.loads(res_raw)
                        if 'candidates' in res_data and len(res_data['candidates']) > 0:
                            ai_reply = res_data['candidates'][0]['content']['parts'][0]['text']
                            success = True
                            break # Successful response, exit loop
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        continue # Try next key if rate limited
                    elif e.code == 503:
                        ai_reply = "Google server is busy right now. Please try again in a second!"
                    else:
                        ai_reply = f"API Server Error ({e.code})"
                except Exception:
                    continue

            if not success and ai_reply == "Velox is getting ready, please try again.":
                ai_reply = "All servers are busy due to high traffic. Please try again shortly!"

            safe_reply = str(ai_reply).encode('ascii', 'ignore').decode('ascii')
            if not safe_reply.strip():
                safe_reply = "Done."

            response_body = json.dumps({"reply": safe_reply}).encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_body)

        except Exception:
            err_body = json.dumps({"reply": "Please send message again."}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(err_body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
                    
