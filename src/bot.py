from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import logging

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logger = logging.getLogger(__name__)

BOT_TOKEN = "7469991306:AAE3c2AtRQf5qDgVCGVEcl0QAtaI9Wl8NiM"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("📊 Combo du Jour", callback_data='combo_day')],
        [InlineKeyboardButton("🏆 Top Score", callback_data='top_score')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message = """
𝗕𝗲𝘁𝗦𝗺𝗮𝗿𝘁 𝗣𝗿𝗼
━━━━━━━━━━━━━━

🎯 Bienvenue ! Choisissez une option :

📊 Combo du Jour :
- Analyses optimisées
- Prédictions fiables
- Mises à jour quotidiennes

🏆 Top Score :
- Meilleures opportunités
- Stats détaillées
- Fort potentiel

━━━━━━━━━━━━━━
    """
    
    await update.message.reply_text(message, reply_markup=reply_markup)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    if query.data == 'combo_day':
        message = """
𝗕𝗲𝘁𝗦𝗺𝗮𝗿𝘁 𝗣𝗿𝗼 - 𝗖𝗼𝗺𝗯𝗼 𝗱𝘂 𝗝𝗼𝘂𝗿
━━━━━━━━━━━━━━

📊 Statistiques actuelles:
- Réussite: 94.2% ✅
- Performance: +12.5% 📈
- Utilisateurs: 12.5K 👥

🎯 Recommandations du jour:
[Mise à jour quotidienne à 10h00]

━━━━━━━━━━━━━━"""
        
    elif query.data == 'top_score':
        message = """
𝗕𝗲𝘁𝗦𝗺𝗮𝗿𝘁 𝗣𝗿𝗼 - 𝗧𝗼𝗽 𝗦𝗰𝗼𝗿𝗲
━━━━━━━━━━━━━━

🏆 Meilleures sélections:
- Fiabilité: 92% 🎯
- Cotes moyennes: 1.85 📊
- ROI moyen: +15.2% 💹

[Actualisé toutes les 3h]

━━━━━━━━━━━━━━"""
    
    keyboard = [
        [InlineKeyboardButton("🔄 Actualiser", callback_data='refresh')],
        [InlineKeyboardButton("🔙 Retour", callback_data='back')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.message.edit_text(message, reply_markup=reply_markup)

def main():
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.run_polling()

if __name__ == '__main__':
    main()
