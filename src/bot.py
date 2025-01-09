from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import logging

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

BOT_TOKEN = "7469991306:AAE3c2AtRQf5qDgVCGVEcl0QAtaI9Wl8NiM"
WEB_APP_URL = "VOTRE_URL_GITHUB_PAGES"  # Il faudra remplacer par l'URL de votre GitHub Pages

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Gestionnaire de la commande /start."""
    keyboard = [
        [InlineKeyboardButton(
            "🚀 Lancer BetSmart Pro",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = """
𝗕𝗲𝘁𝗦𝗺𝗮𝗿𝘁 𝗣𝗿𝗼
━━━━━━━━━━━━━━

Bienvenue dans votre assistant de paris intelligent !

Cliquez sur le bouton ci-dessous pour accéder à l'application.

━━━━━━━━━━━━━━"""
    
    await update.message.reply_text(message, reply_markup=reply_markup)

def main():
    """Démarrage du bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.run_polling()

if __name__ == '__main__':
    main()
