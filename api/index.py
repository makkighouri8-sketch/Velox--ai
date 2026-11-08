<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velox AI</title>
  <link rel="stylesheet" href="style.css">
</head>
<body style="background: #131314; color: #e3e3e3; font-family: 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden;">

  <!-- Top Navigation Header -->
  <header style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #131314; border-bottom: 1px solid #2b2c2f; position: relative;">
    <div style="display: flex; align-items: center; gap: 16px;">
      <button id="menuBtn" style="background: none; border: none; color: #c4c7c5; font-size: 20px; cursor: pointer;">☰</button>
      <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 18px; color: #fff;">
        <span style="color: #a8c7fa; font-size: 20px;">✦</span> Velox AI
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 12px;">
      <button id="upgradeBtn" style="background: #a8c7fa; color: #001d35; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
        <span>✦</span> Upgrade
      </button>

      <!-- Google Profile Avatar Button -->
      <div style="position: relative;">
        <button id="profileAvatarBtn" style="width: 36px; height: 36px; border-radius: 50%; background: #7c3aed; color: #fff; border: none; font-weight: bold; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          J
        </button>

        <!-- Google Profile Drawer / Dropdown -->
        <div id="profileDropdown" style="display: none; position: absolute; right: 0; top: 45px; width: 320px; background: #1e1f20; border: 1px solid #3c4043; border-radius: 24px; padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 1000;">
          <div style="text-align: center; padding: 12px 0; border-bottom: 1px solid #3c4043; margin-bottom: 12px;">
            <div style="font-size: 13px; color: #c4c7c5; margin-bottom: 4px;" id="userEmailDisplay">jamshedkhan78661@gmail.com</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #2b2c2f; padding: 10px; border-radius: 30px; margin-top: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #7c3aed; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold;">J</div>
              <div style="text-align: left; font-size: 14px; font-weight: 500; color: #fff;">Jamshed Khan</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <button class="dropdown-item" id="manageGoogleAccount" style="background: #2b2c2f; border: none; color: #fff; padding: 12px 16px; border-radius: 16px; text-align: left; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 12px;">
              <span style="color: #a8c7fa;">G</span> Manage your Google Account
            </button>
            <button class="dropdown-item" id="upgradePlanBtn" style="background: #2b2c2f; border: none; color: #fff; padding: 12px 16px; border-radius: 16px; text-align: left; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 12px;">
              <span style="color: #fde047;">✦</span> Upgrade to Velox AI Pro
            </button>
            <button class="dropdown-item" id="settingsBtn" style="background: #2b2c2f; border: none; color: #fff; padding: 12px 16px; border-radius: 16px; text-align: left; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 12px;">
              ⚙️ Settings
            </button>
            <button class="dropdown-item" id="logoutBtn" style="background: #3f1d1d; border: none; color: #f87171; padding: 12px 16px; border-radius: 16px; text-align: left; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 12px; margin-top: 4px;">
              🚪 Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Chat & Welcome Area -->
  <main id="chatContainer" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; align-items: center; max-width: 800px; width: 100%; margin: 0 auto; box-sizing: border-box;">
    
    <!-- Welcome Screen -->
    <div class="welcome-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; margin-top: 60px;">
      <div style="font-size: 42px; margin-bottom: 12px;">✦</div>
      <h1 style="font-size: 32px; font-weight: 500; background: linear-gradient(90deg, #9bbbf0, #c4b5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 32px 0;">
        What's next, Jamshed?
      </h1>
    </div>

  </main>

  <!-- Input Bar Footer -->
  <footer style="padding: 16px 20px; display: flex; justify-content: center; background: #131314;">
    <div style="background: #1e1f20; border-radius: 28px; padding: 10px 16px; display: flex; align-items: center; gap: 12px; max-width: 800px; width: 100%; border: 1px solid #3c4043;">
      <button id="plusBtn" style="background: none; border: none; color: #c4c7c5; font-size: 20px; cursor: pointer;">+</button>
      <textarea id="userInput" rows="1" placeholder="Ask Velox AI..." style="flex: 1; background: none; border: none; color: #fff; font-size: 16px; resize: none; outline: none; max-height: 150px; line-height: 1.5;"></textarea>
      <button id="micBtn" style="background: none; border: none; color: #c4c7c5; font-size: 18px; cursor: pointer;">🎤</button>
      <button id="sendBtn" style="background: #e3e3e3; color: #131314; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer;">➤</button>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>
