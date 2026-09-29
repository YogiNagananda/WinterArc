import type { Quote } from '../types';

export const quotes: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The pain of discipline is nothing like the pain of disappointment.", author: "Justin Langer" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Hard times create strong men. Strong men create good times.", author: "G. Michael Hopf" },
  { text: "You don't have to be extreme, just consistent.", author: "Unknown" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "You could leave life right now. Let that determine what you do and say and think.", author: "Marcus Aurelius" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { text: "How long are you going to wait before you demand the best for yourself?", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "He who conquers himself is the mightiest warrior.", author: "Confucius" },
  { text: "Knowing is not enough, we must apply. Willing is not enough, we must do.", author: "Bruce Lee" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "Be water, my friend.", author: "Bruce Lee" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your body hears everything your mind says.", author: "Naomi Judd" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'", author: "Muhammad Ali" },
  { text: "Champions aren't made in gyms. Champions are made from something deep inside them.", author: "Muhammad Ali" },
  { text: "Strength does not come from the physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "Out of suffering have emerged the strongest souls.", author: "Khalil Gibran" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It is hard to fail, but it is worse never to have tried to succeed.", author: "Theodore Roosevelt" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
  { text: "The best fighter is never angry.", author: "Lao Tzu" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "It is not that we have a short time to live, but that we waste much of it.", author: "Seneca" },
  { text: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
  { text: "The gem cannot be polished without friction, nor man perfected without trials.", author: "Chinese Proverb" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "Nothing in the world can take the place of persistence.", author: "Calvin Coolidge" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine" },
  { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
  { text: "The body achieves what the mind believes.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Winter is coming. Prepare your mind, body, and soul.", author: "Winter Arc" },
  { text: "Comfort is the enemy of growth.", author: "Unknown" },
  { text: "Make yourself hard to kill.", author: "Unknown" },
  { text: "Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them.", author: "Unknown" },
  { text: "Your future self is watching you right now through memories.", author: "Unknown" },
];

/**
 * Get a deterministic quote for a given day (based on day-of-year).
 */
export function getQuoteForDate(dateStr: string): Quote {
  // Simple deterministic hash from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % quotes.length;
  return quotes[index];
}

/**
 * Get a random quote (different from the given index).
 */
export function getRandomQuote(excludeIndex?: number): { quote: Quote; index: number } {
  let index: number;
  do {
    index = Math.floor(Math.random() * quotes.length);
  } while (index === excludeIndex && quotes.length > 1);
  return { quote: quotes[index], index };
}
