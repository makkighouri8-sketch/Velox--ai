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

            api_key = os.environ.get('GEMINI_API_KEY')
            if not api_key:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "API key missing"}')
                return

            # Gemini API Request (gemini-2.5-flash)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            payload = json.dumps({
                "contents": [{"parts": [{"text": user_message}]}]
            }).encode('utf-8')

            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            
            ai_reply = "No response"
            try:
                with urllib.request.urlopen(req) as response:
                    res_raw = response.read().decode('utf-8', errors='ignore')
                    res_data = json.loads(res_raw)
                    if 'candidates' in res_data and len(res_data['candidates']) > 0:
                        ai_reply = res_data['candidates'][0]['content']['parts'][0]['text']
            except urllib.error.HTTPError as e:
                err_body = e.read().decode('utf-8', errors='ignore')
                ai_reply = f"API Error HTTP {e.code}"
            except Exception as inner_ex:
                ai_reply = "Connection processing error"

            # Clean text strictly to ASCII to prevent any encoding crash
            safe_reply = str(ai_reply).encode('ascii', 'ignore').decode('ascii')
            if not safe_reply.strip():
                safe_reply = "Response received."

            response_body = json.dumps({"reply": safe_reply}).encode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_body)

        except Exception as err:
            err_body = json.dumps({"reply": "Server error occurred."}).encode('utf-8')
            self.send_response(200) # Sending 200 with friendly message to prevent UI crash
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
    
