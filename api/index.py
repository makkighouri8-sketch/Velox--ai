from flask import Flask, request, jsonify
import os
import google.generativeai as genai

app = Flask(__name__)

# Configure Gemini API using environment variable from Vercel
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@app.route('/api/', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON request"}), 400
            
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
            
        if not api_key:
            return jsonify({"error": "GEMINI_API_KEY is not configured on the server."}), 500
            
        # Using gemini-1.5-flash with proper initialization
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(user_message)
        
        return jsonify({"reply": response.text})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
    
