import { supabase } from './lib/supabase.js'
import { ROUTE_TITLES, ROUTE_TITLES_EN } from './data.js'

const LANG_STORAGE_KEY = 'trackparts-lang'

export const translations = {
  'Sākums': 'Home', 'Katalogs': 'Catalog', 'Sludinājumi': 'Listings', 'Pārdot detaļu': 'Sell a part', 'Mans konts': 'My account', 'Par mums': 'About us', 'Kontakti': 'Contact',
  'KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ': 'QUALITY USED PARTS · SHIPPING ACROSS EUROPE', 'BEZMAKSAS PIEGĀDE NO 150 €': 'FREE SHIPPING FROM €150',
  'GROZS': 'CART', 'TAVS GROZS': 'YOUR CART', 'SKATĪT GROZU ↗': 'VIEW CART ↗', 'Atlasītās': 'Selected', 'detaļas.': 'parts.', 'KOPĀ': 'TOTAL', 'UZ NORĒĶINU ↗': 'CHECKOUT ↗', 'NOTĪRĪT GROZU': 'CLEAR CART', 'Grozs ir tukšs.': 'Cart is empty.',
  'PASŪTĪJUMA PIEPRASĪJUMS': 'ORDER REQUEST', 'Pabeidz': 'Complete', 'pasūtījumu.': 'your order.',
  'Apmaksa tiešsaistē vēl nav pieejama — pēc pieprasījuma nosūtīšanas mēs sazināsimies pa e-pastu, lai vienotos par apmaksu un piegādi.': "Online payment isn't available yet — after you send the request we'll contact you by email to arrange payment and delivery.",
  'VĀRDS, UZVĀRDS': 'FULL NAME', 'E-PASTS': 'EMAIL', 'TĀLRUNIS': 'PHONE', 'PIEGĀDES ADRESE': 'DELIVERY ADDRESS', 'PIEZĪMES': 'NOTES', 'NOSŪTĪT': 'SEND', '← ATPAKAĻ': '← BACK',
  'PALDIES!': 'THANKS!', 'Pasūtījums': 'Order', 'saņemts.': 'received.', 'AIZVĒRT': 'CLOSE',
  'DETAĻAS, KURĀM VAR UZTICĒTIES': 'PARTS YOU CAN TRUST', 'Tava automašīna.': 'Your car.', 'Mūsu detaļas.': 'Our parts.',
  'Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.': 'Checked used car parts. Found fast, shipped safely.', 'SKATĪT KATALOGU': 'BROWSE CATALOG',
  'DETAĻAS': 'PARTS', 'NOLIKTAVĀ': 'IN STOCK', 'ĀTRA': 'FAST', 'IZSŪTĪŠANA': 'SHIPPING', 'PIEGĀDE': 'SHIPPING', 'VISĀ EIROPĀ': 'ACROSS EUROPE',
  '01 / ATRODI SAVU DETAĻU': '01 / FIND YOUR PART', 'Ko tu meklē?': 'What are you looking for?', 'Meklē pēc nosaukuma, OEM koda vai detaļas numura.': 'Search by name, OEM code or part number.',
  'MEKLĒT': 'SEARCH', 'MARKA': 'BRAND', 'Visas markas': 'All brands', 'MODELIS': 'MODEL', 'Visi modeļi': 'All models', 'DETAĻAS TIPS': 'PART TYPE', 'Visas kategorijas': 'All categories',
  'KĀRTOT': 'SORT', 'Jaunākie': 'Newest', 'Cena: no zemākās': 'Price: low to high', 'Cena: no augstākās': 'Price: high to low',
  '+ VAIRĀK FILTRU': '+ MORE FILTERS', '- MAZĀK FILTRU': '- FEWER FILTERS', 'VAIRĀK FILTRU': 'MORE FILTERS', 'PIEMĒROT CENU': 'APPLY PRICE',
  'STĀVOKLIS': 'CONDITION', 'Jebkurš': 'Any', 'Ļoti labs': 'Very good', 'Labs': 'Good', 'Pārbaudīts': 'Tested', 'Pārbaudīta': 'Tested', 'Ar defektu': 'Has a defect',
  'CENA NO (€)': 'PRICE FROM (€)', 'CENA LĪDZ (€)': 'PRICE TO (€)', 'GADS': 'YEAR',
  'MARKAS, KO PAZĪSTAM': 'BRANDS WE KNOW',
  '02 / IZPĒTI KATEGORIJAS': '02 / EXPLORE CATEGORIES', 'Viss, kas vajadzīgs': 'Everything you need', 'tavam auto.': 'for your car.', 'SKATĪT VISU': 'SEE ALL', 'IZVĒLIES KATEGORIJU': 'CHOOSE A CATEGORY',
  'Dzinējs': 'Engine', 'Virsbūve': 'Body', 'Salons': 'Interior', 'Balstiekārta': 'Suspension', 'Elektrība': 'Electrical', 'Riteņi & diski': 'Wheels & tires', 'Riteņi un diski': 'Wheels & tires',
  '03 / JAUNUMI NOLIKTAVĀ': '03 / NEW IN STOCK', 'Pēdējie': 'Latest', 'atradumi.': 'finds.', 'SKATĪT VISUS': 'SEE ALL', 'PIEVIENOT': 'ADD', 'PRECES': 'PARTS',
  'RĀDĪT VAIRĀK ↓': 'SHOW MORE ↓', 'Nav rezultātu.': 'No results.', 'Neviena prece neatbilst meklējumam.': 'No items match your search.',
  '04 / KOPIENAS SLUDINĀJUMI': '04 / COMMUNITY LISTINGS', 'Ko pārdod': 'What others', 'citi.': 'sell.', 'PĀRDOT SAVU DETAĻU': 'SELL YOUR PART',
  'Ielādējam sludinājumus...': 'Loading listings...', 'DETAĻA': 'PART', 'AUTO': 'CAR', 'CENA': 'PRICE', 'Nav norādīts': 'Not specified',
  'Pārbaudīta kvalitāte': 'Checked quality', 'Katra detaļa tiek apskatīta pirms nosūtīšanas.': 'Every part is inspected before shipping.',
  'Piegāde Eiropā': 'European shipping', 'No mūsu noliktavas Rīgā līdz tavām durvīm.': 'From our warehouse in Riga to your door.',
  'Atbalsts 7 dienas': 'Support 7 days', 'Zini, ko pērc. Mēs palīdzēsim atrast pareizo.': "Know what you're buying. We'll help you find the right part.",
  'Rīga, Latvija': 'Riga, Latvia',
  '02 / PREČU KATALOGS': '02 / PRODUCT CATALOG', 'Atrodi detaļu.': 'Find your part.', 'Uztaisi ātrāku.': 'Go faster.',
  'Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.': 'Original, inspected parts for street cars, track builds and repairs.',
  'FILTRĒ KATALOGU': 'FILTER CATALOG', 'VISAS DETAĻAS': 'ALL PARTS', 'Noliktavā': 'In stock', 'tagad.': 'now.', 'Neviena detaļa neatbilst meklējumam.': 'No parts match your search.',
  '03 / PAR TRACKPARTS': '03 / ABOUT TRACKPARTS', 'Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.': 'We find good parts for people who know how much every corner matters.',
  'MŪSU PIEEJA': 'OUR APPROACH', 'Nevis detaļu kaudze.': 'Not a pile of parts.', 'Īstais atradums.': 'The right find.',
  'TrackParts sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.': "TrackParts started in Riga with one simple idea: a used part shouldn't mean a compromise. Every part is inspected, photographed and labelled so you can buy with confidence.",
  'Mūsu noliktavā katram kodam ir sava vieta, statuss un vēsture. Mazāk minēšanas, vairāk laika uz ceļa.': 'In our warehouse, every code has its own place, status and history. Less guessing, more time on the road.',
  'Katrs produkts tiek apskatīts pirms pārdošanas.': "Every product is inspected before it's sold.", 'No Rīgas līdz tavām durvīm.': 'From Riga to your door.',
  'Cilvēcīgs atbalsts': 'Human support', 'Palīdzēsim atrast pareizo detaļu.': "We'll help you find the right part.",
  '04 / SAZINĀSIMIES': '04 / GET IN TOUCH', 'Ir jautājums?': 'Got a question?', 'Dod ziņu.': 'Send us a note.',
  'Neatrodi detaļu katalogā? Atsūti VIN, OEM kodu vai bildi, un mēs paskatīsimies.': "Can't find a part in the catalog? Send us the VIN, OEM code or a photo and we'll take a look.",
  'RAKSTI MUMS': 'WRITE TO US', 'Atbildēsim': "We'll reply", 'ātri.': 'fast.', 'TELEFONS': 'PHONE', 'ATRODI MŪS': 'FIND US',
  '05 / TAVS KONTS': '05 / YOUR ACCOUNT', 'Pieslēdzies.': 'Sign in.', 'Pārdod.': 'Sell.',
  'Izveido kontu, lai ievietotu detaļas un pārvaldītu savus sludinājumus.': 'Create an account to post parts and manage your listings.',
  'LIETOTĀJA PIEKĻUVE': 'USER ACCESS', 'Ienākt vai': 'Sign in or', 'reģistrēties.': 'sign up.', 'PAROLE': 'PASSWORD',
  'IELOGOTIES ↗': 'SIGN IN ↗', 'IZVEIDOT KONTU': 'CREATE ACCOUNT', 'IZVEIDOT KONTU ↗': 'CREATE ACCOUNT ↗', 'AIZMIRSI PAROLI?': 'FORGOT PASSWORD?',
  'IELOGOTIES': 'SIGN IN', 'REĢISTRĒTIES': 'SIGN UP', 'Sveicināts': 'Welcome to', 'TrackParts.': 'TrackParts.',
  'Ievadi e-pastu un paroli.': 'Enter your email and password.', 'Ievadi e-pastu, lai atjaunotu paroli.': 'Enter your email to reset your password.',
  'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.': 'Account created. Check your email and click the confirmation link.',
  'Paroles atjaunošanas saite nosūtīta uz e-pastu.': 'Password reset link sent to your email.',
  'Sveiks,': 'Hi,', 'Tu esi ielogojies kā': "You're signed in as", 'PĀRDOT DETAĻU ↗': 'SELL A PART ↗', 'IZIET': 'LOG OUT', 'SKATĪT MANU PROFILU ↗': 'VIEW MY PROFILE ↗',
  'E-pasts apstiprināts — tu esi ielogojies!': "Email confirmed — you're signed in!",
  'VĀRDS': 'NAME', 'PILSĒTA': 'CITY', 'LIETOTĀJVĀRDS': 'USERNAME', 'SAGLABĀT IZMAIŅAS ↗': 'SAVE CHANGES ↗', 'Profils saglabāts.': 'Profile saved.',
  'MANI SLUDINĀJUMI': 'MY LISTINGS', 'Tavi': 'Your', 'Rediģēt sludinājumu': 'Edit listing', 'SAGLABĀT ↗': 'SAVE ↗', 'ATCELT': 'CANCEL',
  'SLUDINĀJUMS': 'LISTING', 'STATUSS': 'STATUS', 'DARBĪBAS': 'ACTIONS', 'Rediģēt': 'Edit', 'Dzēst': 'Delete', 'Tev vēl nav neviena sludinājuma.': "You don't have any listings yet.",
  'MANI PASŪTĪJUMI': 'MY ORDERS', 'Pasūtījumu': 'Order', 'vēsture.': 'history.', 'Tev vēl nav neviena pasūtījuma.': "You don't have any orders yet.",
  'SAGLABĀTIE SLUDINĀJUMI': 'SAVED LISTINGS', 'favorīti.': 'favorites.', 'Tev vēl nav neviena saglabāta sludinājuma.': "You don't have any saved listings yet.",
  'BĪSTAMĀ ZONA': 'DANGER ZONE', 'Dzēst': 'Delete', 'kontu.': 'account.', 'DZĒST KONTU': 'DELETE ACCOUNT',
  'Divfaktoru': 'Two-factor', 'autentifikācija.': 'authentication.', 'IESLĒGT 2FA': 'ENABLE 2FA', 'IZSLĒGT 2FA': 'DISABLE 2FA',
  'Gaida apstiprinājumu': 'Awaiting approval', 'Aktīvs': 'Active', 'Rezervēts': 'Reserved', 'Pārdots': 'Sold', 'Noņemts': 'Removed',
  'Sludinājums publicēts! Pārvaldi to savā kontā (Mans konts).': 'Listing published! Manage it from your account (My account).',
  'JAUNA PAROLE': 'NEW PASSWORD', 'Uzstādi': 'Set', 'jaunu paroli.': 'a new password.', 'JAUNĀ PAROLE': 'NEW PASSWORD', 'SAGLABĀT PAROLI ↗': 'SAVE PASSWORD ↗',
  '06 / JAUNS SLUDINĀJUMS': '06 / NEW LISTING', 'Ieliec detaļu': 'Put your part', 'uz ceļa.': 'on the road.',
  'Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.': 'Fill in the details, add photos, and reach the person who needs it.',
  'DETAĻAS INFORMĀCIJA': 'PART INFORMATION', 'Ko tu': 'What are', 'pārdod?': 'you selling?',
  'NOSAUKUMS': 'TITLE', 'CENA (€)': 'PRICE (€)', 'OEM NUMURS': 'OEM NUMBER', 'DZINĒJS': 'ENGINE', 'KATEGORIJA': 'CATEGORY', 'ATRAŠANĀS VIETA': 'LOCATION',
  'APRAKSTS': 'DESCRIPTION', 'BILDES': 'PHOTOS', 'PUBLICĒT SLUDINĀJUMU ↗': 'PUBLISH LISTING ↗', 'ESOŠĀS BILDES': 'EXISTING PHOTOS', 'PIEVIENOT BILDES': 'ADD PHOTOS', 'Nav pievienotu bilžu': 'No photos added',
  '04 / KOPIENAS TIRGUS': '04 / COMMUNITY MARKETPLACE', 'Redzi, ko citi': 'See what others', 'pārdod.': 'are selling.',
  'Īstas detaļas no TrackParts kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.': 'Real parts from the TrackParts community. Open a listing to see the seller and get in touch.',
  'AKTĪVIE SLUDINĀJUMI': 'ACTIVE LISTINGS', 'Jaunākie': 'Latest', 'sludinājumi.': 'listings.',
  '← ATPAKAĻ UZ SLUDINĀJUMIEM': '← BACK TO LISTINGS', 'SLUDINĀJUMA INFORMĀCIJA': 'LISTING INFORMATION', 'AKTĪVS SLUDINĀJUMS': 'ACTIVE LISTING',
  'PĀRDEVĒJS': 'SELLER', 'SAZINĀTIES ↗': 'CONTACT ↗', 'RAKSTĪT E-PASTU ↗': 'EMAIL US ↗', 'ZIŅOT PAR SLUDINĀJUMU': 'REPORT LISTING', 'NOSŪTĪT ZIŅOJUMU ↗': 'SEND REPORT ↗',
  '♡ SAGLABĀT': '♡ SAVE', '♥ SAGLABĀTS': '♥ SAVED',
  '← ATPAKAĻ UZ KATALOGU': '← BACK TO CATALOG', 'KATALOGA PRECE': 'CATALOG ITEM', 'PIEVIENOT GROZAM ↗': 'ADD TO CART ↗', '✓ PIEVIENOTS GROZAM': '✓ ADDED TO CART', 'IR NOLIKTAVĀ': 'IN STOCK', 'NAV NOLIKTAVĀ': 'OUT OF STOCK',
  'Detaļa nav atrasta': 'Part not found', 'Sludinājums nav atrasts': 'Listing not found', 'Šī detaļa pašlaik nav noliktavā.': 'This part is currently out of stock.', 'Sasniegts pieejamais atlikums noliktavā.': 'Maximum available stock reached.', 'MAKS. DAUDZUMS': 'MAX STOCK',
  'RAŽOTĀJA KODS': 'PART CODE', 'RAŽOTĀJS': 'MANUFACTURER', 'GADS / DZINĒJS': 'YEAR / ENGINE', 'NOLIKTAVA': 'WAREHOUSE', 'SVARS / IZMĒRI': 'WEIGHT / DIMENSIONS', 'GARANTIJA': 'WARRANTY',
  'TRACKPARTS KATALOGS': 'TRACKPARTS CATALOG', 'Kataloga': 'Catalog', 'preces.': 'items.', 'VISAS KATEGORIJAS': 'ALL CATEGORIES', 'PĀRDOT ŠEIT ↗': 'SELL HERE ↗',
  'KATEGORIJA /': 'CATEGORY /', 'Šeit redzamas tikai': 'Only showing', 'detaļas no kataloga un kopienas sludinājumiem.': 'parts from the catalog and community listings.', 'KOPIENAS SLUDINĀJUMI /': 'COMMUNITY LISTINGS /', 'Lietota detaļa': 'Used part',
  'Šajā kategorijā pašlaik nav kataloga preču.': 'No catalog items in this category yet.', 'Šajā kategorijā pašlaik nav aktīvu sludinājumu.': 'No active listings in this category yet.',
  '← ATPAKAĻ UZ SĀKUMU': '← BACK TO HOME', 'Citi pārdod': 'Others sell', 'Pievieno detaļu grozam vispirms.': 'Add a part to your cart first.',
  'VEIKALS': 'SHOP', 'Pārbaudītas detaļas': 'Inspected parts', 'Kopienas sludinājumi': 'Community listings', 'Kategorijas': 'Categories',
  'PALĪDZĪBA': 'HELP', 'Piegāde': 'Delivery', 'Atgriešana': 'Returns', 'RUNĀSIM': "LET'S TALK",
  'Lietošanas noteikumi': 'Terms of use', 'Privātuma politika': 'Privacy policy',
  'LIETOŠANAS NOTEIKUMI': 'TERMS OF USE', 'Noteikumi.': 'Terms.', 'Skaidri un godīgi.': 'Clear and fair.', 'Šie noteikumi regulē TrackParts interneta veikala un sludinājumu platformas lietošanu.': 'These terms govern the use of the TrackParts online store and listings platform.',
  'PRIVĀTUMA POLITIKA': 'PRIVACY POLICY', 'Tavi dati.': 'Your data.', 'Mūsu atbildība.': 'Our responsibility.', 'Šī politika izskaidro, kādus personas datus TrackParts apstrādā un kāpēc, saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR).': 'This policy explains what personal data TrackParts processes and why, in accordance with the General Data Protection Regulation (GDPR).',
  'TIRDZNIECĪBAS NOTEIKUMI': 'MARKETPLACE RULES', 'Tirgus noteikumi.': 'Marketplace rules.', 'Godīga spēle visiem.': 'Fair play for everyone.', 'Papildu noteikumi, kas regulē detaļu ievietošanu un tirdzniecību TrackParts kopienas sludinājumos.': 'Additional rules governing listing and trading parts in TrackParts community listings.',
  'DROŠĪBA': 'SAFETY', 'Droši darījumi.': 'Safe deals.', 'Tavai drošībai.': 'For your safety.', 'Ieteikumi, kā droši pirkt un pārdot TrackParts kopienas sludinājumos.': 'Tips for buying and selling safely in TrackParts community listings.',
  'Tirdzniecības noteikumi': 'Marketplace rules', 'Drošība': 'Safety',
  'Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.': 'This document is only available in Latvian. Contact us if you need a translation.',
  'Piekrītu': 'I agree to the', 'un': 'and', 'Privātuma politikai': 'Privacy Policy', 'Lietošanas noteikumiem': 'Terms of Use', '(nepieciešams, veidojot jaunu kontu).': '(required when creating a new account).',
  'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.': 'You must agree to the Terms of Use and Privacy Policy to create an account.',
  'Šī vietne izmanto tikai tehniski nepieciešamu lokālo glabātuvi, lai uzturētu tavu pieslēgšanās sesiju. Uzzini vairāk mūsu': 'This site only uses technically necessary local storage to keep you signed in. Learn more in our', 'SAPRATU': 'GOT IT', 'Privātuma politikā': 'Privacy Policy',
  'Auto detaļas bez liekām': 'Car parts without the', 'rūpēm.': 'hassle.',
  'PĀRDEVĒJA PROFILS': 'SELLER PROFILE', 'Pārdevēja': "Seller's", 'ATSAUKSMES': 'REVIEWS', 'Ko saka': 'What buyers', 'pircēji.': 'say.', 'VĒRTĒJUMS': 'RATING', 'KOMENTĀRS': 'COMMENT', 'PUBLICĒT ATSAUKSMI': 'POST REVIEW', 'ATJAUNOT ATSAUKSMI': 'UPDATE REVIEW',
  'Ielādē...': 'Loading...', 'Ielādējam...': 'Loading...', 'Ielogojies, lai publicētu sludinājumu.': 'Sign in to publish a listing.', 'Lai ievietotu sludinājumu, vispirms ielogojies.': 'Please sign in first to publish a listing.', 'Pārdevējs nav pievienojis aprakstu.': 'Seller has not added a description.', 'Nav norādīta': 'Not specified', 'Paldies! Ziņojums nosūtīts administrācijai.': 'Thanks! Your report has been sent to moderation.', 'Izvēlies vērtējumu.': 'Please select a rating.', 'Vēl nav nevienas atsauksmes.': 'No reviews yet.', 'Ielogojies, lai atstātu atsauksmi.': 'Sign in to leave a review.', 'Šim pārdevējam pašlaik nav aktīvu sludinājumu.': 'This seller has no active listings right now.', 'BILDES (maks. 10 faili, līdz 5 MB katrs)': 'PHOTOS (max 10 files, up to 5 MB each)', '2FA ir ieslēgta šim kontam.': '2FA is enabled for this account.', '2FA nav ieslēgta šim kontam. Ieteicams pārdevējiem, lai pasargātu kontu no pārņemšanas.': '2FA is not enabled for this account. Recommended for sellers to protect against account takeover.', 'Konta dzēšana ir neatgriezeniska. Tiks dzēsti tavi sludinājumi, favorīti un profils.': 'Deleting your account is permanent. Your listings, favorites, and profile will be removed.', 'Šī prece vairs nav pieejama katalogā.': 'This item is no longer available in the catalog.', 'Veiksmīgi ielogojies.': 'Signed in successfully.', 'Parole atjaunota! Tagad vari izmantot jauno paroli.': 'Password updated! You can now use your new password.', 'Ievadi e-pastu un paroli, lai izveidotu kontu.': 'Enter your email and password to create an account.', 'Šis lietotājvārds jau ir aizņemts. Izvēlies citu.': 'This username is already taken. Please choose another.', 'Tu jau esi ziņojis par šo sludinājumu.': 'You have already reported this listing.', '404 / LAPA NAV ATRASTA': '404 / PAGE NOT FOUND', 'Lapa nav': 'Page not', 'atrasta.': 'found.', 'Adrese': 'Address', 'neeksistē vai ir pārvietota.': 'does not exist or has been moved.', 'UZ SĀKUMU': 'BACK TO HOME',
}

export const placeholderTranslations = {
  'Piem., BMW F10 lukturis vai 63117203298': 'E.g. BMW F10 headlight or 63117203298',
  'tavs@epasts.lv': 'you@email.com',
  'Vismaz 6 simboli': 'At least 6 characters',
  'Piem., BMW E46 priekšējais lukturis': 'E.g. BMW E46 front headlight',
  'Rīga, noliktava B3': 'Riga, warehouse B3',
  'Apraksti detaļas stāvokli un zināmos defektus': "Describe the part's condition and any known defects",
  'Piem., 2012': 'E.g. 2012',
  'Meklē...': 'Search...',
  'Meklēt...': 'Search...',
  'Meklē pēc nosaukuma, markas vai modeļa': 'Search by title, brand or model',
  'Kā pagāja darījums?': 'How did the deal go?',
  'Apraksti iemeslu (piem., maldinošs apraksts vai aizdomīgs sludinājums)': 'Describe the reason (e.g. misleading listing or suspected scam)',
}

let english = false
const translationRequests = new Map()
const originalText = new WeakMap()
let translateTimer = null

export function isEnglish() {
  return english
}

export function initLanguage() {
  try {
    english = localStorage.getItem(LANG_STORAGE_KEY) === 'en'
  } catch {
    english = false
  }
  syncDocumentLanguage()
}

export function toggleLanguage() {
  english = !english
  try {
    localStorage.setItem(LANG_STORAGE_KEY, english ? 'en' : 'lv')
  } catch {
    // ignore storage errors
  }
  syncDocumentLanguage()
  translatePage()
  primeAndTranslate()
}

export function syncDocumentLanguage(route) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = english ? 'en' : 'lv'
  if (route) {
    const map = english ? ROUTE_TITLES_EN : ROUTE_TITLES
    if (map[route]) document.title = map[route]
  }
}

async function translateText(text) {
  const key = (text || '').trim()
  if (!key || /^[\d\s.,€%-]+$/.test(key)) return key
  if (translations[key]) return translations[key]
  if (translationRequests.has(key)) return translationRequests.get(key)
  const request = (async () => {
    if (!supabase) return key
    try {
      const { data } = await supabase
        .from('translations_cache')
        .select('translated_text')
        .eq('source_text', key)
        .maybeSingle()
      if (data?.translated_text) return data.translated_text
      const { data: result, error } = await supabase.functions.invoke('translate-cache', {
        body: { source_text: key },
      })
      if (result?.translated_text && result.translated_text !== key) return result.translated_text
      if (error) {
        console.warn('translate-cache failed:', error.message || error)
        translationRequests.delete(key)
      }
      return key
    } catch (err) {
      console.warn('translate-cache error:', err)
      translationRequests.delete(key)
      return key
    }
  })()
  translationRequests.set(key, request)
  return request
}

const DYNAMIC_TRANSLATION_SELECTORS =
  '.product-card h3, #product-title, #product-description, .listing-title-cell strong, #detail-title, #detail-description, .cart-item strong'

function scheduleTranslatePage() {
  if (translateTimer) return
  translateTimer = setTimeout(() => {
    translateTimer = null
    if (english) translatePage()
  }, 60)
}

export async function primeAndTranslate() {
  if (!english) return
  const texts = new Set()
  document.querySelectorAll(DYNAMIC_TRANSLATION_SELECTORS).forEach((el) => {
    const t = el.textContent.trim()
    if (t && !translations[t]) texts.add(t)
  })
  const queue = [...texts]
  if (!queue.length) return
  const workerCount = Math.min(3, queue.length)
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length) {
        const text = queue.shift()
        const translated = await translateText(text)
        if (translated && translated !== text) {
          translations[text] = translated
          scheduleTranslatePage()
        }
      }
    }),
  )
  if (english) translatePage()
}

export function translatePage() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let node
  while ((node = walker.nextNode())) textNodes.push(node)
  textNodes.forEach((textNode) => {
    const original = originalText.get(textNode) || textNode.nodeValue.trim()
    if (!original || textNode.parentElement?.tagName === 'SCRIPT') return
    if (!originalText.has(textNode)) originalText.set(textNode, original)
    const translated = english ? translations[original] || original : originalText.get(textNode)
    if (textNode.nodeValue.trim() !== translated) {
      textNode.nodeValue = textNode.nodeValue.replace(textNode.nodeValue.trim(), translated)
    }
  })
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((input) => {
    if (!input.dataset.lvPlaceholder) input.dataset.lvPlaceholder = input.placeholder
    const lv = input.dataset.lvPlaceholder
    input.placeholder = english ? placeholderTranslations[lv] || lv : lv
  })
  document.querySelectorAll('.lang').forEach((languageButton) => {
    languageButton.innerHTML = english ? 'EN <small>/ LV</small>' : 'LV <small>/ EN</small>'
  })
}
