import { supabase } from './lib/supabase.js'
import { getRouteTitles } from './data.js'
import { syncAllSelects } from './selects.js'

const LANG_STORAGE_KEY = 'trackparts-lang'
export const SUPPORTED_LANGS = ['lv', 'en', 'ru']

export const translations = {
  'Sākums': 'Home', 'Katalogs': 'Catalog', 'Sludinājumi': 'Listings', 'Pārdot detaļu': 'Sell a part', 'Mans konts': 'My account', 'Par mums': 'About us', 'Kontakti': 'Contact',
  'KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ': 'QUALITY USED PARTS · SHIPPING ACROSS EUROPE', 'BEZMAKSAS PIEGĀDE NO 150 €': 'FREE SHIPPING FROM €150',
  'GROZS': 'CART', 'TAVS GROZS': 'YOUR CART', 'SKATĪT GROZU ↗': 'VIEW CART ↗', 'Atlasītās': 'Selected', 'detaļas.': 'parts.', 'KOPĀ': 'TOTAL', 'UZ NORĒĶINU': 'CHECKOUT', 'UZ NORĒĶINU ↗': 'CHECKOUT ↗', 'NOTĪRĪT GROZU': 'CLEAR CART', 'Grozs ir tukšs.': 'Cart is empty.',
  'Pievienots grozam': 'Added to cart',
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
  'Dzinēja': 'Engine', 'Virsbūves': 'Body', 'Salona': 'Interior', 'Balstiekārtas': 'Suspension', 'Elektrības': 'Electrical', 'Riteņu un disku': 'Wheels & tires',
  'OEM PĀRBAUDĪTAS DETAĻAS': 'OEM VERIFIED PARTS', 'RĪGAS NOLIKTAVA TIEŠSAISTĒ': 'RIGA WAREHOUSE LIVE', '24H IZSŪTĪŠANA VISĀ EIROPĀ': '24H DISPATCH ACROSS EU', 'PĀRBAUDĪTS PIRMS NOSŪTĪŠANAS': 'INSPECTED BEFORE SHIPMENT',
  'Būvēts ceļam': 'Built for the', 'uz priekšu.': 'road ahead.', 'IELOGOTIES, LAI ATSTĀTU ATSAUKSMI ↗': 'SIGN IN TO LEAVE A REVIEW ↗',
  '03 / JAUNUMI NOLIKTAVĀ': '03 / NEW IN STOCK', 'Pēdējie': 'Latest', 'atradumi.': 'finds.', 'SKATĪT VISUS': 'SEE ALL', 'PIEVIENOT': 'ADD', 'PRECES': 'PARTS',
  'RĀDĪT VAIRĀK ↓': 'SHOW MORE ↓', 'Nav rezultātu.': 'No results.', 'Neviena prece neatbilst meklējumam.': 'No items match your search.',
  '04 / KOPIENAS SLUDINĀJUMI': '04 / COMMUNITY LISTINGS', 'Ko pārdod': 'What others', 'citi.': 'sell.', 'PĀRDOT SAVU DETAĻU': 'SELL YOUR PART',
  'Ielādējam sludinājumus...': 'Loading listings...', 'Ielādējam katalogu...': 'Loading catalog...', 'Pašlaik nav neviena aktīva sludinājuma.': 'No active listings right now.', 'DETAĻA': 'PART', 'AUTO': 'CAR', 'CENA': 'PRICE', 'Nav norādīts': 'Not specified',
  'Pārbaudīta kvalitāte': 'Checked quality', 'Katra detaļa tiek apskatīta pirms nosūtīšanas.': 'Every part is inspected before shipping.',
  'Piegāde Eiropā': 'European shipping', 'No mūsu noliktavas Rīgā līdz tavām durvīm.': 'From our warehouse in Riga to your door.',
  'Atbalsts 7 dienas': 'Support 7 days', 'Zini, ko pērc. Mēs palīdzēsim atrast pareizo.': "Know what you're buying. We'll help you find the right part.",
  'Rīga, Latvija': 'Riga, Latvia',
  '02 / PREČU KATALOGS': '02 / PRODUCT CATALOG', 'Atrodi detaļu.': 'Find your part.', 'Uztaisi ātrāku.': 'Go faster.',
  'Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.': 'Original, inspected parts for street cars, track builds and repairs.',
  'FILTRĒ KATALOGU': 'FILTER CATALOG', 'VISAS DETAĻAS': 'ALL PARTS', 'Noliktavā': 'In stock', 'tagad.': 'now.', 'Neviena detaļa neatbilst meklējumam.': 'No parts match your search.',
  '03 / PAR TRACKAPART': '03 / ABOUT TRACKAPART', 'Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.': 'We find good parts for people who know how much every corner matters.',
  'MŪSU PIEEJA': 'OUR APPROACH', 'Nevis detaļu kaudze.': 'Not a pile of parts.', 'Īstais atradums.': 'The right find.',
  'TrackApart sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.': "TrackApart started in Riga with one simple idea: a used part shouldn't mean a compromise. Every part is inspected, photographed and labelled so you can buy with confidence.",
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
  'IELOGOTIES': 'SIGN IN', 'REĢISTRĒTIES': 'SIGN UP', 'Sveicināts': 'Welcome to', 'TrackApart.': 'TrackApart.',
  'Ielogojies': 'Sign in to', 'Izveido': 'Create an', 'kontu.': 'account.', 'Pieslēdzies, lai piekļūtu savam kontam, sludinājumiem un favorītiem.': 'Sign in to access your account, listings, and favorites.', 'Vēl nav konta?': "Don't have an account?", 'Reģistrēties': 'Sign up', 'Jau ir konts?': 'Already have an account?', 'Ielogoties': 'Sign in', 'Aizmirsi paroli?': 'Forgot your password?', 'Tavs': 'Your', 'konts.': 'account.', 'Pārvaldi savu profilu, sludinājumus, pasūtījumus un favorītus.': 'Manage your profile, listings, orders, and favorites.', 'Ielādējam kontu...': 'Loading account...', 'Pieslēgšanās sistēma pašlaik nav pieejama.': 'Sign-in is currently unavailable.',
  'Ievadi e-pastu un paroli.': 'Enter your email and password.', 'Ievadi e-pastu, lai atjaunotu paroli.': 'Enter your email to reset your password.',
  'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.': 'Account created. Check your email and click the confirmation link.',
  'Paroles atjaunošanas saite nosūtīta uz e-pastu.': 'Password reset link sent to your email.',
  'Sveiks,': 'Hi,', 'Tu esi ielogojies kā': "You're signed in as", 'PĀRDOT DETAĻU ↗': 'SELL A PART ↗', 'IZIET': 'LOG OUT', 'SKATĪT MANU PROFILU ↗': 'VIEW MY PROFILE ↗',
  'E-pasts apstiprināts — tu esi ielogojies!': "Email confirmed — you're signed in!",
  'VĀRDS': 'NAME', 'PILSĒTA': 'CITY', 'LIETOTĀJVĀRDS': 'USERNAME', 'SAGLABĀT IZMAIŅAS ↗': 'SAVE CHANGES ↗', 'Profils saglabāts.': 'Profile saved.',
  'MANI SLUDINĀJUMI': 'MY LISTINGS', 'Tavi': 'Your', 'Rediģēt sludinājumu': 'Edit listing', 'SAGLABĀT ↗': 'SAVE ↗', 'ATCELT': 'CANCEL',
  'SLUDINĀJUMS': 'LISTING', 'STATUSS': 'STATUS', 'DARBĪBAS': 'ACTIONS', 'Rediģēt': 'Edit', 'Dzēst': 'Delete', 'Tev vēl nav neviena sludinājuma.': "You don't have any listings yet.",
  'MANI PASŪTĪJUMI': 'MY ORDERS', 'Pasūtījumu': 'Order', 'vēsture.': 'history.', 'Tev vēl nav neviena pasūtījuma.': "You don't have any orders yet.", 'PASŪTĪJUMS': 'ORDER', 'DATUMS': 'DATE', 'SUMMA': 'TOTAL', 'Ielādējam pasūtījumus...': 'Loading orders...', 'Pasūtījumu vēsture vēl nav pieejama.': 'Order history is not available yet.',
  'SAGLABĀTIE SLUDINĀJUMI': 'SAVED LISTINGS', 'favorīti.': 'favorites.', 'Tev vēl nav neviena saglabāta sludinājuma.': "You don't have any saved listings yet.", 'Favorīti vēl nav pieejami.': 'Favorites are not available yet.',
  'BĪSTAMĀ ZONA': 'DANGER ZONE', 'DZĒST KONTU': 'DELETE ACCOUNT',
  'Divfaktoru': 'Two-factor', 'autentifikācija.': 'authentication.', 'IESLĒGT 2FA': 'ENABLE 2FA', 'IZSLĒGT 2FA': 'DISABLE 2FA',
  'Ievadi': 'Enter', '2FA kodu.': 'your 2FA code.', 'Šim kontam ir ieslēgta divfaktoru autentifikācija. Ievadi kodu no savas autentifikācijas lietotnes.': 'Two-factor authentication is enabled for this account. Enter the code from your authenticator app.', 'ATCELT UN IZIET': 'CANCEL AND SIGN OUT', 'KODS': 'CODE', 'APSTIPRINĀT': 'VERIFY', 'AKTIVIZĒT': 'ACTIVATE', 'Atslēga:': 'Key:',
  'Gaida apstiprinājumu': 'Awaiting approval', 'Aktīvs': 'Active', 'Rezervēts': 'Reserved', 'Pārdots': 'Sold', 'Noņemts': 'Removed', 'Apmaksāts': 'Paid', 'Nosūtīts': 'Shipped', 'Pabeigts': 'Completed', 'Atcelts': 'Cancelled',
  'Sludinājums publicēts! Pārvaldi to savā kontā (Mans konts).': 'Listing published! Manage it from your account (My account).',
  'JAUNA PAROLE': 'NEW PASSWORD', 'Uzstādi': 'Set', 'jaunu paroli.': 'a new password.', 'JAUNĀ PAROLE': 'NEW PASSWORD', 'SAGLABĀT PAROLI ↗': 'SAVE PASSWORD ↗',
  '06 / JAUNS SLUDINĀJUMS': '06 / NEW LISTING', 'Ieliec detaļu': 'Put your part', 'uz ceļa.': 'on the road.',
  'Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.': 'Fill in the details, add photos, and reach the person who needs it.',
  'DETAĻAS INFORMĀCIJA': 'PART INFORMATION', 'Ko tu': 'What are', 'pārdod?': 'you selling?',
  'NOSAUKUMS': 'TITLE', 'CENA (€)': 'PRICE (€)', 'OEM NUMURS': 'OEM NUMBER', 'DZINĒJS': 'ENGINE', 'KATEGORIJA': 'CATEGORY', 'ATRAŠANĀS VIETA': 'LOCATION',
  'APRAKSTS': 'DESCRIPTION', 'BILDES': 'PHOTOS', 'PUBLICĒT SLUDINĀJUMU ↗': 'PUBLISH LISTING ↗', 'ESOŠĀS BILDES': 'EXISTING PHOTOS', 'PIEVIENOT BILDES': 'ADD PHOTOS', 'Nav pievienotu bilžu': 'No photos added', 'Nav bildes': 'No photo', 'Auto detaļa': 'Car part',
  '04 / KOPIENAS TIRGUS': '04 / COMMUNITY MARKETPLACE', 'Redzi, ko citi': 'See what others', 'pārdod.': 'are selling.',
  'Īstas detaļas no TrackApart kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.': 'Real parts from the TrackApart community. Open a listing to see the seller and get in touch.',
  'AKTĪVIE SLUDINĀJUMI': 'ACTIVE LISTINGS', 'sludinājumi.': 'listings.',
  '← ATPAKAĻ UZ SLUDINĀJUMIEM': '← BACK TO LISTINGS', 'SLUDINĀJUMA INFORMĀCIJA': 'LISTING INFORMATION', 'AKTĪVS SLUDINĀJUMS': 'ACTIVE LISTING',
  'PĀRDEVĒJS': 'SELLER', 'SAZINĀTIES ↗': 'CONTACT ↗', 'RAKSTĪT E-PASTU ↗': 'EMAIL US ↗', 'ZIŅOT PAR SLUDINĀJUMU': 'REPORT LISTING', 'NOSŪTĪT ZIŅOJUMU ↗': 'SEND REPORT ↗',
  '♡ SAGLABĀT': '♡ SAVE', '♥ SAGLABĀTS': '♥ SAVED',
  '← ATPAKAĻ UZ KATALOGU': '← BACK TO CATALOG', 'KATALOGA PRECE': 'CATALOG ITEM', 'PIEVIENOT GROZAM ↗': 'ADD TO CART ↗', '✓ PIEVIENOTS GROZAM': '✓ ADDED TO CART', 'IR NOLIKTAVĀ': 'IN STOCK', 'NAV NOLIKTAVĀ': 'OUT OF STOCK',
  'Detaļa nav atrasta': 'Part not found', 'Sludinājums nav atrasts': 'Listing not found', 'Šī detaļa pašlaik nav noliktavā.': 'This part is currently out of stock.', 'Sasniegts pieejamais atlikums noliktavā.': 'Maximum available stock reached.', 'MAKS. DAUDZUMS': 'MAX STOCK',
  'RAŽOTĀJA KODS': 'PART CODE', 'RAŽOTĀJS': 'MANUFACTURER', 'GADS / DZINĒJS': 'YEAR / ENGINE', 'NOLIKTAVA': 'WAREHOUSE', 'SVARS / IZMĒRI': 'WEIGHT / DIMENSIONS', 'GARANTIJA': 'WARRANTY',
  'TRACKAPART KATALOGS': 'TRACKAPART CATALOG', 'Kataloga': 'Catalog', 'preces.': 'items.', 'VISAS KATEGORIJAS': 'ALL CATEGORIES', 'PĀRDOT ŠEIT ↗': 'SELL HERE ↗',
  'KATEGORIJA /': 'CATEGORY /', 'Šeit redzamas tikai': 'Only showing', 'detaļas no kataloga un kopienas sludinājumiem.': 'parts from the catalog and community listings.', 'KOPIENAS SLUDINĀJUMI /': 'COMMUNITY LISTINGS /', 'Lietota detaļa': 'Used part',
  'Šajā kategorijā pašlaik nav kataloga preču.': 'No catalog items in this category yet.', 'Šajā kategorijā pašlaik nav aktīvu sludinājumu.': 'No active listings in this category yet.',
  '← ATPAKAĻ UZ SĀKUMU': '← BACK TO HOME', 'Citi pārdod': 'Others sell', 'Pievieno detaļu grozam vispirms.': 'Add a part to your cart first.',
  'VEIKALS': 'SHOP', 'Pārbaudītas detaļas': 'Inspected parts', 'Kopienas sludinājumi': 'Community listings', 'Kategorijas': 'Categories',
  'PALĪDZĪBA': 'HELP', 'Piegāde': 'Delivery', 'Atgriešana': 'Returns', 'RUNĀSIM': "LET'S TALK",
  'Lietošanas noteikumi': 'Terms of use', 'Privātuma politika': 'Privacy policy',
  'LIETOŠANAS NOTEIKUMI': 'TERMS OF USE', 'Noteikumi.': 'Terms.', 'Skaidri un godīgi.': 'Clear and fair.', 'Šie noteikumi regulē TrackApart interneta veikala un sludinājumu platformas lietošanu.': 'These terms govern the use of the TrackApart online store and listings platform.',
  'PRIVĀTUMA POLITIKA': 'PRIVACY POLICY', 'Tavi dati.': 'Your data.', 'Mūsu atbildība.': 'Our responsibility.', 'Šī politika izskaidro, kādus personas datus TrackApart apstrādā un kāpēc, saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR).': 'This policy explains what personal data TrackApart processes and why, in accordance with the General Data Protection Regulation (GDPR).',
  'TIRDZNIECĪBAS NOTEIKUMI': 'MARKETPLACE RULES', 'Tirgus noteikumi.': 'Marketplace rules.', 'Godīga spēle visiem.': 'Fair play for everyone.', 'Papildu noteikumi, kas regulē detaļu ievietošanu un tirdzniecību TrackApart kopienas sludinājumos.': 'Additional rules governing listing and trading parts in TrackApart community listings.',
  'DROŠĪBA': 'SAFETY', 'Droši darījumi.': 'Safe deals.', 'Tavai drošībai.': 'For your safety.', 'Ieteikumi, kā droši pirkt un pārdot TrackApart kopienas sludinājumos.': 'Tips for buying and selling safely in TrackApart community listings.',
  'Tirdzniecības noteikumi': 'Marketplace rules', 'Drošība': 'Safety',
  'Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.': 'This document is only available in Latvian. Contact us if you need a translation.',
  'Piekrītu': 'I agree to the', 'un': 'and', 'Privātuma politikai': 'Privacy Policy', 'Lietošanas noteikumiem': 'Terms of Use', '(nepieciešams, veidojot jaunu kontu).': '(required when creating a new account).',
  'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.': 'You must agree to the Terms of Use and Privacy Policy to create an account.',
  'Šī vietne izmanto tikai tehniski nepieciešamu lokālo glabātuvi, lai uzturētu tavu pieslēgšanās sesiju. Uzzini vairāk mūsu': 'This site only uses technically necessary local storage to keep you signed in. Learn more in our', 'SAPRATU': 'GOT IT', 'Privātuma politikā': 'Privacy Policy',
  'Auto detaļas bez liekām': 'Car parts without the', 'rūpēm.': 'hassle.',
  'PĀRDEVĒJA PROFILS': 'SELLER PROFILE', 'Pārdevēja': "Seller's", 'ATSAUKSMES': 'REVIEWS', 'ATSAUKSMES UN VĒRTĒJUMI': 'REVIEWS & RATINGS', 'Ko saka': 'What buyers', 'pircēji.': 'say.', 'VĒRTĒJUMS': 'RATING', 'KOMENTĀRS': 'COMMENT', 'PUBLICĒT ATSAUKSMI': 'POST REVIEW', 'ATJAUNOT ATSAUKSMI': 'UPDATE REVIEW',
  'KOPĒT SAITI': 'COPY LINK', '✓ SAITE NOKOPĒTA': '✓ LINK COPIED', 'Profila saite nokopēta starpliktuvē.': 'Profile link copied to clipboard.', 'Neizdevās nokopēt saiti.': 'Could not copy link.',
  'REDIĢĒT PROFILU ↗': 'EDIT PROFILE ↗', 'VIDĒJAIS VĒRTĒJUMS': 'AVERAGE RATING', 'DALĪBNIEKS KOPŠ': 'MEMBER SINCE', 'Pieejamas detaļas': 'Available parts', 'TrackApart kopiena': 'TrackApart community', 'Vēl nav vērtējumu': 'No ratings yet', 'Vēl nav atsauksmju': 'No reviews yet',
  'PĀRSKATS': 'OVERVIEW', 'SLUDINĀJUMI': 'LISTINGS', 'SKATĪT': 'VIEW', 'Jauns pārdevējs': 'New seller',
  '★ AUGSTI NOVĒRTĒTS': '★ TOP RATED', 'AKTĪVS PĀRDEVĒJS': 'ACTIVE SELLER', 'TAVS PROFILS': 'YOUR PROFILE', 'TAVA ATSAUKSME': 'YOUR REVIEW', 'Tava atsauksme': 'Your review',
  'ATSTĀT ATSAUKSMI': 'LEAVE A REVIEW', 'Novērtē pārdevēju': 'Rate this seller', 'Rediģē savu vērtējumu': 'Edit your rating', 'Izvēlies zvaigznes': 'Select stars',
  'Slikti': 'Poor', 'Viduvēji': 'Fair', 'Labi': 'Good', 'Izcili!': 'Excellent!', 'DZĒST': 'DELETE', 'Atsauksme dzēsta.': 'Review deleted.', 'Atsauksme saglabāta!': 'Review saved!',
  'Jaunākās': 'Newest', 'Augstākais vērtējums': 'Highest rated', 'Zemākais vērtējums': 'Lowest rated',
  'Bez komentāra.': 'No comment.', 'Nav atsauksmju ar šo vērtējumu.': 'No reviews with this rating.',
  'Dalies ar pieredzi': 'Share your experience', 'Pieslēdzies savam kontam, lai novērtētu šo pārdevēju.': 'Sign in to your account to rate this seller.',
  'TAVS PUBLISKAIS PROFILS': 'YOUR PUBLIC PROFILE', 'Tā tevi redz pircēji': 'How buyers see you', 'Vari atjaunot savu vārdu, pilsētu un sludinājumus sava konta iestatījumos.': 'You can update your name, city, and listings in your account settings.', 'ATVĒRT MANU KONTU ↗': 'OPEN MY ACCOUNT ↗',
  'Pievienojies': 'Joined', 'pozitīvas': 'positive', 'atsauksme': 'review', 'atsauksmes': 'reviews', 'Tikai': 'Only', 'ATJAUNOT ATSAUKSMI ↗': 'UPDATE REVIEW ↗', 'PUBLICĒT ATSAUKSMI ↗': 'POST REVIEW ↗',
  'Izvēlne': 'Menu', 'Aizvērt izvēlni': 'Close menu', 'Aizvērt': 'Close', 'Aizvērt grozu': 'Close cart', 'Galvenā navigācija': 'Main navigation', 'Meklēt': 'Search', 'Grozs': 'Cart', 'Profila sadaļas': 'Profile sections', 'Vērtējumu sadalījums': 'Rating breakdown', 'Kārtot preces': 'Sort products', 'Kārtot atsauksmes': 'Sort reviews', 'Saglabāt sludinājumu': 'Save listing', 'Pievienot grozam': 'Add to cart',
  'Ielādē...': 'Loading...', 'Ielādējam...': 'Loading...', 'Ielogojies, lai publicētu sludinājumu.': 'Sign in to publish a listing.', 'Lai ievietotu sludinājumu, vispirms ielogojies.': 'Please sign in first to publish a listing.', 'Pārdevējs nav pievienojis aprakstu.': 'Seller has not added a description.', 'Nav norādīta': 'Not specified', 'Paldies! Ziņojums nosūtīts administrācijai.': 'Thanks! Your report has been sent to moderation.', 'Izvēlies vērtējumu.': 'Please select a rating.', 'Vēl nav nevienas atsauksmes.': 'No reviews yet.', 'Ielogojies, lai atstātu atsauksmi.': 'Sign in to leave a review.', 'Šim pārdevējam pašlaik nav aktīvu sludinājumu.': 'This seller has no active listings right now.', 'BILDES (maks. 10 faili, līdz 5 MB katrs)': 'PHOTOS (max 10 files, up to 5 MB each)', '2FA ir ieslēgta šim kontam.': '2FA is enabled for this account.', '2FA nav ieslēgta šim kontam. Ieteicams pārdevējiem, lai pasargātu kontu no pārņemšanas.': '2FA is not enabled for this account. Recommended for sellers to protect against account takeover.', 'Konta dzēšana ir neatgriezeniska. Tiks dzēsti tavi sludinājumi, favorīti un profils.': 'Deleting your account is permanent. Your listings, favorites, and profile will be removed.', 'Šī prece vairs nav pieejama katalogā.': 'This item is no longer available in the catalog.', 'Veiksmīgi ielogojies.': 'Signed in successfully.', 'Parole atjaunota! Tagad vari izmantot jauno paroli.': 'Password updated! You can now use your new password.', 'Ievadi e-pastu un paroli, lai izveidotu kontu.': 'Enter your email and password to create an account.', 'Šis lietotājvārds jau ir aizņemts. Izvēlies citu.': 'This username is already taken. Please choose another.', 'Tu jau esi ziņojis par šo sludinājumu.': 'You have already reported this listing.', '404 / LAPA NAV ATRASTA': '404 / PAGE NOT FOUND', 'Lapa nav': 'Page not', 'atrasta.': 'found.', 'Adrese': 'Address', 'neeksistē vai ir pārvietota.': 'does not exist or has been moved.', 'UZ SĀKUMU': 'BACK TO HOME',
}

export const translationsRu = {
  'Sākums': 'Главная', 'Katalogs': 'Каталог', 'Sludinājumi': 'Объявления', 'Pārdot detaļu': 'Продать запчасть', 'Mans konts': 'Мой аккаунт', 'Par mums': 'О нас', 'Kontakti': 'Контакты',
  'KVALITĀTES LIETOTAS DETAĻAS · PIEGĀDE VISĀ EIROPĀ': 'КАЧЕСТВЕННЫЕ Б/У ЗАПЧАСТИ · ДОСТАВКА ПО ВСЕЙ ЕВРОПЕ', 'BEZMAKSAS PIEGĀDE NO 150 €': 'БЕСПЛАТНАЯ ДОСТАВКА ОТ 150 €',
  'GROZS': 'КОРЗИНА', 'TAVS GROZS': 'ВАША КОРЗИНА', 'SKATĪT GROZU ↗': 'ОТКРЫТЬ КОРЗИНУ ↗', 'Atlasītās': 'Выбранные', 'detaļas.': 'запчасти.', 'KOPĀ': 'ИТОГО', 'UZ NORĒĶINU': 'ОФОРМИТЬ ЗАКАЗ', 'UZ NORĒĶINU ↗': 'ОФОРМИТЬ ЗАКАЗ ↗', 'NOTĪRĪT GROZU': 'ОЧИСТИТЬ КОРЗИНУ', 'Grozs ir tukšs.': 'Корзина пуста.',
  'Pievienots grozam': 'Добавлено в корзину',
  'PASŪTĪJUMA PIEPRASĪJUMS': 'ЗАЯВКА НА ЗАКАЗ', 'Pabeidz': 'Завершите', 'pasūtījumu.': 'заказ.',
  'Apmaksa tiešsaistē vēl nav pieejama — pēc pieprasījuma nosūtīšanas mēs sazināsimies pa e-pastu, lai vienotos par apmaksu un piegādi.': 'Онлайн-оплата пока недоступна — после отправки заявки мы свяжемся с вами по электронной почте для согласования оплаты и доставки.',
  'VĀRDS, UZVĀRDS': 'ИМЯ, ФАМИЛИЯ', 'E-PASTS': 'ЭЛ. ПОЧТА', 'TĀLRUNIS': 'ТЕЛЕФОН', 'PIEGĀDES ADRESE': 'АДРЕС ДОСТАВКИ', 'PIEZĪMES': 'ПРИМЕЧАНИЯ', 'NOSŪTĪT': 'ОТПРАВИТЬ', '← ATPAKAĻ': '← НАЗАД',
  'PALDIES!': 'СПАСИБО!', 'Pasūtījums': 'Заказ', 'saņemts.': 'получен.', 'AIZVĒRT': 'ЗАКРЫТЬ',
  'DETAĻAS, KURĀM VAR UZTICĒTIES': 'ЗАПЧАСТИ, КОТОРЫМ МОЖНО ДОВЕРЯТЬ', 'Tava automašīna.': 'Твой автомобиль.', 'Mūsu detaļas.': 'Наши запчасти.',
  'Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.': 'Проверенные б/у автозапчасти. Быстрый поиск, надёжная доставка.', 'SKATĪT KATALOGU': 'СМОТРЕТЬ КАТАЛОГ',
  'DETAĻAS': 'ЗАПЧАСТЕЙ', 'NOLIKTAVĀ': 'НА СКЛАДЕ', 'ĀTRA': 'БЫСТРАЯ', 'IZSŪTĪŠANA': 'ОТПРАВКА', 'PIEGĀDE': 'ДОСТАВКА', 'VISĀ EIROPĀ': 'ПО ВСЕЙ ЕВРОПЕ',
  '01 / ATRODI SAVU DETAĻU': '01 / НАЙДИ СВОЮ ЗАПЧАСТЬ', 'Ko tu meklē?': 'Что вы ищете?', 'Meklē pēc nosaukuma, OEM koda vai detaļas numura.': 'Поиск по названию, OEM-коду или номеру детали.',
  'MEKLĒT': 'ИСКАТЬ', 'MARKA': 'МАРКА', 'Visas markas': 'Все марки', 'MODELIS': 'МОДЕЛЬ', 'Visi modeļi': 'Все модели', 'DETAĻAS TIPS': 'ТИП ДЕТАЛИ', 'Visas kategorijas': 'Все категории',
  'KĀRTOT': 'СОРТИРОВКА', 'Jaunākie': 'Сначала новые', 'Cena: no zemākās': 'Цена: по возрастанию', 'Cena: no augstākās': 'Цена: по убыванию',
  '+ VAIRĀK FILTRU': '+ БОЛЬШЕ ФИЛЬТРОВ', '- MAZĀK FILTRU': '- МЕНЬШЕ ФИЛЬТРОВ', 'VAIRĀK FILTRU': 'БОЛЬШЕ ФИЛЬТРОВ', 'PIEMĒROT CENU': 'ПРИМЕНИТЬ ЦЕНУ',
  'STĀVOKLIS': 'СОСТОЯНИЕ', 'Jebkurš': 'Любое', 'Ļoti labs': 'Очень хорошее', 'Labs': 'Хорошее', 'Pārbaudīts': 'Проверено', 'Pārbaudīta': 'Проверено', 'Ar defektu': 'С дефектом',
  'CENA NO (€)': 'ЦЕНА ОТ (€)', 'CENA LĪDZ (€)': 'ЦЕНА ДО (€)', 'GADS': 'ГОД',
  'MARKAS, KO PAZĪSTAM': 'МАРКИ, КОТОРЫЕ МЫ ЗНАЕМ',
  '02 / IZPĒTI KATEGORIJAS': '02 / КАТЕГОРИИ ЗАПЧАСТЕЙ', 'Viss, kas vajadzīgs': 'Всё необходимое', 'tavam auto.': 'для вашего авто.', 'SKATĪT VISU': 'СМОТРЕТЬ ВСЕ', 'IZVĒLIES KATEGORIJU': 'ВЫБЕРИТЕ КАТЕГОРИЮ',
  'Dzinējs': 'Двигатель', 'Virsbūve': 'Кузов', 'Salons': 'Салон', 'Balstiekārta': 'Подвеска', 'Elektrība': 'Электрика', 'Riteņi & diski': 'Колёса и диски', 'Riteņi un diski': 'Колёса и диски',
  'Dzinēja': 'Двигатель:', 'Virsbūves': 'Кузов:', 'Salona': 'Салон:', 'Balstiekārtas': 'Подвеска:', 'Elektrības': 'Электрика:', 'Riteņu un disku': 'Колёса и диски:',
  'OEM PĀRBAUDĪTAS DETAĻAS': 'ПРОВЕРЕННЫЕ OEM ЗАПЧАСТИ', 'RĪGAS NOLIKTAVA TIEŠSAISTĒ': 'СКЛАД В РИГЕ ОНЛАЙН', '24H IZSŪTĪŠANA VISĀ EIROPĀ': 'ОТПРАВКА ЗА 24Ч ПО ЕВРОПЕ', 'PĀRBAUDĪTS PIRMS NOSŪTĪŠANAS': 'ПРОВЕРЕНО ПЕРЕД ОТПРАВКОЙ',
  'Būvēts ceļam': 'Создано для', 'uz priekšu.': 'дороги вперёд.', 'IELOGOTIES, LAI ATSTĀTU ATSAUKSMI ↗': 'ВОЙТИ, ЧТОБЫ ОСТАВИТЬ ОТЗЫВ ↗',
  '03 / JAUNUMI NOLIKTAVĀ': '03 / НОВИНКИ НА СКЛАДЕ', 'Pēdējie': 'Свежие', 'atradumi.': 'поступления.', 'SKATĪT VISUS': 'СМОТРЕТЬ ВСЕ', 'PIEVIENOT': 'В КОРЗИНУ', 'PRECES': 'ТОВАРОВ',
  'RĀDĪT VAIRĀK ↓': 'ПОКАЗАТЬ ЕЩЁ ↓', 'Nav rezultātu.': 'Нет результатов.', 'Neviena prece neatbilst meklējumam.': 'По вашему запросу ничего не найдено.',
  '04 / KOPIENAS SLUDINĀJUMI': '04 / ОБЪЯВЛЕНИЯ СООБЩЕСТВА', 'Ko pārdod': 'Что продают', 'citi.': 'другие.', 'PĀRDOT SAVU DETAĻU': 'ПРОДАТЬ СВОЮ ЗАПЧАСТЬ',
  'Ielādējam sludinājumus...': 'Загружаем объявления...', 'Ielādējam katalogu...': 'Загружаем каталог...', 'Pašlaik nav neviena aktīva sludinājuma.': 'Сейчас нет активных объявлений.', 'DETAĻA': 'ДЕТАЛЬ', 'AUTO': 'АВТО', 'CENA': 'ЦЕНА', 'Nav norādīts': 'Не указано',
  'Pārbaudīta kvalitāte': 'Проверенное качество', 'Katra detaļa tiek apskatīta pirms nosūtīšanas.': 'Каждая деталь осматривается перед отправкой.',
  'Piegāde Eiropā': 'Доставка по Европе', 'No mūsu noliktavas Rīgā līdz tavām durvīm.': 'Со склада в Риге прямо до вашей двери.',
  'Atbalsts 7 dienas': 'Поддержка 7 дней', 'Zini, ko pērc. Mēs palīdzēsim atrast pareizo.': 'Знайте, что покупаете. Мы поможем подобрать нужное.',
  'Rīga, Latvija': 'Рига, Латвия',
  '02 / PREČU KATALOGS': '02 / КАТАЛОГ ТОВАРОВ', 'Atrodi detaļu.': 'Найди запчасть.', 'Uztaisi ātrāku.': 'Сделай быстрее.',
  'Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.': 'Оригинальные и проверенные запчасти для городских авто, трековых проектов и сервиса.',
  'FILTRĒ KATALOGU': 'ФИЛЬТР КАТАЛОГА', 'VISAS DETAĻAS': 'ВСЕ ЗАПЧАСТИ', 'Noliktavā': 'На складе', 'tagad.': 'сейчас.', 'Neviena detaļa neatbilst meklējumam.': 'Ни одна запчасть не соответствует поиску.',
  '03 / PAR TRACKAPART': '03 / О TRACKAPART', 'Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.': 'Мы находим качественные запчасти для тех, кто знает цену каждому повороту.',
  'MŪSU PIEEJA': 'НАШ ПОДХОД', 'Nevis detaļu kaudze.': 'Не куча металлолома.', 'Īstais atradums.': 'Нужная находка.',
  'TrackApart sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.': 'TrackApart начался в Риге с простой идеи: б/у запчасть не должна быть компромиссом. Каждая деталь проверяется, фотографируется и маркируется, чтобы вы могли покупать с уверенностью.',
  'Mūsu noliktavā katram kodam ir sava vieta, statuss un vēsture. Mazāk minēšanas, vairāk laika uz ceļa.': 'На нашем складе у каждого кода есть своё место, статус и история. Меньше гаданий, больше времени на дороге.',
  'Katrs produkts tiek apskatīts pirms pārdošanas.': 'Каждый товар проверяется перед продажей.', 'No Rīgas līdz tavām durvīm.': 'Из Риги до вашей двери.',
  'Cilvēcīgs atbalsts': 'Живая поддержка', 'Palīdzēsim atrast pareizo detaļu.': 'Поможем подобрать нужную запчасть.',
  '04 / SAZINĀSIMIES': '04 / СВЯЖИТЕСЬ С НАМИ', 'Ir jautājums?': 'Есть вопрос?', 'Dod ziņu.': 'Напишите нам.',
  'Neatrodi detaļu katalogā? Atsūti VIN, OEM kodu vai bildi, un mēs paskatīsimies.': 'Не нашли деталь в каталоге? Пришлите VIN, OEM-код или фото, и мы посмотрим.',
  'RAKSTI MUMS': 'НАПИШИТЕ НАМ', 'Atbildēsim': 'Ответим', 'ātri.': 'быстро.', 'TELEFONS': 'ТЕЛЕФОН', 'ATRODI MŪS': 'МЫ НАХОДИМСЯ',
  '05 / TAVS KONTS': '05 / ВАШ АККАУНТ', 'Pieslēdzies.': 'Войдите.', 'Pārdod.': 'Продавайте.',
  'Izveido kontu, lai ievietotu detaļas un pārvaldītu savus sludinājumus.': 'Создайте аккаунт, чтобы размещать запчасти и управлять объявлениями.',
  'LIETOTĀJA PIEKĻUVE': 'ДОСТУП ПОЛЬЗОВАТЕЛЯ', 'Ienākt vai': 'Войти или', 'reģistrēties.': 'зарегистрироваться.', 'PAROLE': 'ПАРОЛЬ',
  'IELOGOTIES ↗': 'ВОЙТИ ↗', 'IZVEIDOT KONTU': 'СОЗДАТЬ АККАУНТ', 'IZVEIDOT KONTU ↗': 'СОЗДАТЬ АККАУНТ ↗', 'AIZMIRSI PAROLI?': 'ЗАБЫЛИ ПАРОЛЬ?',
  'IELOGOTIES': 'ВОЙТИ', 'REĢISTRĒTIES': 'РЕГИСТРАЦИЯ', 'Sveicināts': 'Добро пожаловать в', 'TrackApart.': 'TrackApart.',
  'Ielogojies': 'Войдите в', 'Izveido': 'Создайте', 'kontu.': 'аккаунт.', 'Pieslēdzies, lai piekļūtu savam kontam, sludinājumiem un favorītiem.': 'Войдите, чтобы получить доступ к аккаунту, объявлениям и избранному.', 'Vēl nav konta?': 'Нет аккаунта?', 'Reģistrēties': 'Зарегистрироваться', 'Jau ir konts?': 'Уже есть аккаунт?', 'Ielogoties': 'Войти', 'Aizmirsi paroli?': 'Забыли пароль?', 'Tavs': 'Ваш', 'konts.': 'аккаунт.', 'Pārvaldi savu profilu, sludinājumus, pasūtījumus un favorītus.': 'Управляйте профилем, объявлениями, заказами и избранным.', 'Ielādējam kontu...': 'Загружаем аккаунт...', 'Pieslēgšanās sistēma pašlaik nav pieejama.': 'Система входа сейчас недоступна.',
  'Ievadi e-pastu un paroli.': 'Введите эл. почту и пароль.', 'Ievadi e-pastu, lai atjaunotu paroli.': 'Введите эл. почту для сброса пароля.',
  'Konts izveidots. Pārbaudi savu e-pastu un noklikšķini uz apstiprinājuma saites.': 'Аккаунт создан. Проверьте почту и перейдите по ссылке для подтверждения.',
  'Paroles atjaunošanas saite nosūtīta uz e-pastu.': 'Ссылка для сброса пароля отправлена на эл. почту.',
  'Sveiks,': 'Привет,', 'Tu esi ielogojies kā': 'Вы вошли как', 'PĀRDOT DETAĻU ↗': 'ПРОДАТЬ ЗАПЧАСТЬ ↗', 'IZIET': 'ВЫЙТИ', 'SKATĪT MANU PROFILU ↗': 'МОЙ ПРОФИЛЬ ↗',
  'E-pasts apstiprināts — tu esi ielogojies!': 'Эл. почта подтверждена — вы вошли в аккаунт!',
  'VĀRDS': 'ИМЯ', 'PILSĒTA': 'ГОРОД', 'LIETOTĀJVĀRDS': 'ИМЯ ПОЛЬЗОВАТЕЛЯ', 'SAGLABĀT IZMAIŅAS ↗': 'СОХРАНИТЬ ИЗМЕНЕНИЯ ↗', 'Profils saglabāts.': 'Профиль сохранён.',
  'MANI SLUDINĀJUMI': 'МОИ ОБЪЯВЛЕНИЯ', 'Tavi': 'Ваши', 'Rediģēt sludinājumu': 'Редактировать объявление', 'SAGLABĀT ↗': 'СОХРАНИТЬ ↗', 'ATCELT': 'ОТМЕНА',
  'SLUDINĀJUMS': 'ОБЪЯВЛЕНИЕ', 'STATUSS': 'СТАТУС', 'DARBĪBAS': 'ДЕЙСТВИЯ', 'Rediģēt': 'Изменить', 'Dzēst': 'Удалить', 'Tev vēl nav neviena sludinājuma.': 'У вас пока нет объявлений.',
  'MANI PASŪTĪJUMI': 'МОИ ЗАКАЗЫ', 'Pasūtījumu': 'История', 'vēsture.': 'заказов.', 'Tev vēl nav neviena pasūtījuma.': 'У вас пока нет заказов.', 'PASŪTĪJUMS': 'ЗАКАЗ', 'DATUMS': 'ДАТА', 'SUMMA': 'СУММА', 'Ielādējam pasūtījumus...': 'Загружаем заказы...', 'Pasūtījumu vēsture vēl nav pieejama.': 'История заказов пока недоступна.',
  'SAGLABĀTIE SLUDINĀJUMI': 'СОХРАНЁННЫЕ ОБЪЯВЛЕНИЯ', 'favorīti.': 'избранное.', 'Tev vēl nav neviena saglabāta sludinājuma.': 'У вас пока нет сохранённых объявлений.', 'Favorīti vēl nav pieejami.': 'Избранное пока недоступно.',
  'BĪSTAMĀ ZONA': 'ОПАСНАЯ ЗОНА', 'DZĒST KONTU': 'УДАЛИТЬ АККАУНТ',
  'Divfaktoru': 'Двухфакторная', 'autentifikācija.': 'аутентификация.', 'IESLĒGT 2FA': 'ВКЛЮЧИТЬ 2FA', 'IZSLĒGT 2FA': 'ОТКЛЮЧИТЬ 2FA',
  'Ievadi': 'Введите', '2FA kodu.': 'код 2FA.', 'Šim kontam ir ieslēgta divfaktoru autentifikācija. Ievadi kodu no savas autentifikācijas lietotnes.': 'Для этого аккаунта включена двухфакторная аутентификация. Введите код из приложения-аутентификатора.', 'ATCELT UN IZIET': 'ОТМЕНА И ВЫХОД', 'KODS': 'КОД', 'APSTIPRINĀT': 'ПОДТВЕРДИТЬ', 'AKTIVIZĒT': 'АКТИВИРОВАТЬ', 'Atslēga:': 'Ключ:',
  'Gaida apstiprinājumu': 'На модерации', 'Aktīvs': 'Активно', 'Rezervēts': 'Зарезервировано', 'Pārdots': 'Продано', 'Noņemts': 'Снято', 'Apmaksāts': 'Оплачен', 'Nosūtīts': 'Отправлен', 'Pabeigts': 'Завершён', 'Atcelts': 'Отменён',
  'Sludinājums publicēts! Pārvaldi to savā kontā (Mans konts).': 'Объявление опубликовано! Управляйте им в разделе «Мой аккаунт».',
  'JAUNA PAROLE': 'НОВЫЙ ПАРОЛЬ', 'Uzstādi': 'Установите', 'jaunu paroli.': 'новый пароль.', 'JAUNĀ PAROLE': 'НОВЫЙ ПАРОЛЬ', 'SAGLABĀT PAROLI ↗': 'СОХРАНИТЬ ПАРОЛЬ ↗',
  '06 / JAUNS SLUDINĀJUMS': '06 / НОВОЕ ОБЪЯВЛЕНИЕ', 'Ieliec detaļu': 'Выстави запчасть', 'uz ceļa.': 'на дорогу.',
  'Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.': 'Заполните данные, добавьте фото и найдите покупателя.',
  'DETAĻAS INFORMĀCIJA': 'ИНФОРМАЦИЯ О ЗАПЧАСТИ', 'Ko tu': 'Что вы', 'pārdod?': 'продаёте?',
  'NOSAUKUMS': 'НАЗВАНИЕ', 'CENA (€)': 'ЦЕНА (€)', 'OEM NUMURS': 'OEM-НОМЕР', 'DZINĒJS': 'ДВИГАТЕЛЬ', 'KATEGORIJA': 'КАТЕГОРИЯ', 'ATRAŠANĀS VIETA': 'МЕСТОПОЛОЖЕНИЕ',
  'APRAKSTS': 'ОПИСАНИЕ', 'BILDES': 'ФОТОГРАФИИ', 'PUBLICĒT SLUDINĀJUMU ↗': 'ОПУБЛИКОВАТЬ ↗', 'ESOŠĀS BILDES': 'ТЕКУЩИЕ ФОТО', 'PIEVIENOT BILDES': 'ДОБАВИТЬ ФОТО', 'Nav pievienotu bilžu': 'Фотографии не добавлены', 'Nav bildes': 'Нет фото', 'Auto detaļa': 'Автозапчасть',
  '04 / KOPIENAS TIRGUS': '04 / ПЛОЩАДКА СООБЩЕСТВА', 'Redzi, ko citi': 'Смотрите, что', 'pārdod.': 'продают другие.',
  'Īstas detaļas no TrackApart kopienas. Atver sludinājumu, lai redzētu pārdevēju un sazinātos.': 'Реальные запчасти от сообщества TrackApart. Откройте объявление, чтобы увидеть продавца и связаться с ним.',
  'AKTĪVIE SLUDINĀJUMI': 'АКТИВНЫЕ ОБЪЯВЛЕНИЯ', 'sludinājumi.': 'объявления.',
  '← ATPAKAĻ UZ SLUDINĀJUMIEM': '← НАЗАД К ОБЪЯВЛЕНИЯМ', 'SLUDINĀJUMA INFORMĀCIJA': 'ИНФОРМАЦИЯ ОБ ОБЪЯВЛЕНИИ', 'AKTĪVS SLUDINĀJUMS': 'АКТИВНОЕ ОБЪЯВЛЕНИЕ',
  'PĀRDEVĒJS': 'ПРОДАВЕЦ', 'SAZINĀTIES ↗': 'СВЯЗАТЬСЯ ↗', 'RAKSTĪT E-PASTU ↗': 'НАПИСАТЬ НА ПОЧТУ ↗', 'ZIŅOT PAR SLUDINĀJUMU': 'ПОЖАЛОВАТЬСЯ НА ОБЪЯВЛЕНИЕ', 'NOSŪTĪT ZIŅOJUMU ↗': 'ОТПРАВИТЬ ЖАЛОБУ ↗',
  '♡ SAGLABĀT': '♡ В ИЗБРАННОЕ', '♥ SAGLABĀTS': '♥ В ИЗБРАННОМ',
  '← ATPAKAĻ UZ KATALOGU': '← НАЗАД В КАТАЛОГ', 'KATALOGA PRECE': 'ТОВАР ИЗ КАТАЛОГА', 'PIEVIENOT GROZAM ↗': 'ДОБАВИТЬ В КОРЗИНУ ↗', '✓ PIEVIENOTS GROZAM': '✓ ДОБАВЛЕНО В КОРЗИНУ', 'IR NOLIKTAVĀ': 'В НАЛИЧИИ', 'NAV NOLIKTAVĀ': 'НЕТ В НАЛИЧИИ',
  'Detaļa nav atrasta': 'Деталь не найдена', 'Sludinājums nav atrasts': 'Объявление не найдено', 'Šī detaļa pašlaik nav noliktavā.': 'Этой детали сейчас нет на складе.', 'Sasniegts pieejamais atlikums noliktavā.': 'Достигнут максимальный остаток на складе.', 'MAKS. DAUDZUMS': 'МАКС. ОСТАТОК',
  'RAŽOTĀJA KODS': 'КОД ПРОИЗВОДИТЕЛЯ', 'RAŽOTĀJS': 'ПРОИЗВОДИТЕЛЬ', 'GADS / DZINĒJS': 'ГОД / ДВИГАТЕЛЬ', 'NOLIKTAVA': 'СКЛАД', 'SVARS / IZMĒRI': 'ВЕС / РАЗМЕРЫ', 'GARANTIJA': 'ГАРАНТИЯ',
  'TRACKAPART KATALOGS': 'КАТАЛОГ TRACKAPART', 'Kataloga': 'Товары', 'preces.': 'каталога.', 'VISAS KATEGORIJAS': 'ВСЕ КАТЕГОРИИ', 'PĀRDOT ŠEIT ↗': 'ПРОДАТЬ ЗДЕСЬ ↗',
  'KATEGORIJA /': 'КАТЕГОРИЯ /', 'Šeit redzamas tikai': 'Показаны только запчасти категории', 'detaļas no kataloga un kopienas sludinājumiem.': 'из каталога и объявлений сообщества.', 'KOPIENAS SLUDINĀJUMI /': 'ОБЪЯВЛЕНИЯ СООБЩЕСТВА /', 'Lietota detaļa': 'Б/у запчасть',
  'Šajā kategorijā pašlaik nav kataloga preču.': 'В этой категории пока нет товаров из каталога.', 'Šajā kategorijā pašlaik nav aktīvu sludinājumu.': 'В этой категории пока нет активных объявлений.',
  '← ATPAKAĻ UZ SĀKUMU': '← НА ГЛАВНУЮ', 'Citi pārdod': 'Другие продают', 'Pievieno detaļu grozam vispirms.': 'Сначала добавьте деталь в корзину.',
  'VEIKALS': 'МАГАЗИН', 'Pārbaudītas detaļas': 'Проверенные запчасти', 'Kopienas sludinājumi': 'Объявления сообщества', 'Kategorijas': 'Категории',
  'PALĪDZĪBA': 'ПОМОЩЬ', 'Piegāde': 'Доставка', 'Atgriešana': 'Возврат', 'RUNĀSIM': 'КОНТАКТЫ',
  'Lietošanas noteikumi': 'Условия использования', 'Privātuma politika': 'Политика конфиденциальности',
  'LIETOŠANAS NOTEIKUMI': 'УСЛОВИЯ ИСПОЛЬЗОВАНИЯ', 'Noteikumi.': 'Условия.', 'Skaidri un godīgi.': 'Понятно и честно.', 'Šie noteikumi regulē TrackApart interneta veikala un sludinājumu platformas lietošanu.': 'Эти условия регулируют использование интернет-магазина и площадки объявлений TrackApart.',
  'PRIVĀTUMA POLITIKA': 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ', 'Tavi dati.': 'Ваши данные.', 'Mūsu atbildība.': 'Наша ответственность.', 'Šī politika izskaidro, kādus personas datus TrackApart apstrādā un kāpēc, saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR).': 'Эта политика объясняет, какие персональные данные обрабатывает TrackApart и зачем, в соответствии с GDPR.',
  'TIRDZNIECĪBAS NOTEIKUMI': 'ПРАВИЛА ПЛОЩАДКИ', 'Tirgus noteikumi.': 'Правила торговли.', 'Godīga spēle visiem.': 'Честная игра для всех.', 'Papildu noteikumi, kas regulē detaļu ievietošanu un tirdzniecību TrackApart kopienas sludinājumos.': 'Дополнительные правила размещения и торговли запчастями в объявлениях сообщества TrackApart.',
  'DROŠĪBA': 'БЕЗОПАСНОСТЬ', 'Droši darījumi.': 'Безопасные сделки.', 'Tavai drošībai.': 'Для вашей безопасности.', 'Ieteikumi, kā droši pirkt un pārdot TrackApart kopienas sludinājumos.': 'Рекомендации по безопасным покупкам и продажам в объявлениях сообщества TrackApart.',
  'Tirdzniecības noteikumi': 'Правила площадки', 'Drošība': 'Безопасность',
  'Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.': 'Этот документ доступен только на латышском языке. Свяжитесь с нами, если нужен перевод.',
  'Piekrītu': 'Я согласен с', 'un': 'и', 'Privātuma politikai': 'Политикой конфиденциальности', 'Lietošanas noteikumiem': 'Условиями использования', '(nepieciešams, veidojot jaunu kontu).': '(обязательно при создании нового аккаунта).',
  'Lai izveidotu kontu, jāpiekrīt Lietošanas noteikumiem un Privātuma politikai.': 'Для создания аккаунта необходимо принять Условия использования и Политику конфиденциальности.',
  'Šī vietne izmanto tikai tehniski nepieciešamu lokālo glabātuvi, lai uzturētu tavu pieslēgšanās sesiju. Uzzini vairāk mūsu': 'Этот сайт использует только технически необходимое локальное хранилище для поддержания сессии входа. Подробнее в нашей', 'SAPRATU': 'ПОНЯТНО', 'Privātuma politikā': 'Политике конфиденциальности',
  'Auto detaļas bez liekām': 'Автозапчасти без лишних', 'rūpēm.': 'хлопот.',
  'PĀRDEVĒJA PROFILS': 'ПРОФИЛЬ ПРОДАВЦА', 'Pārdevēja': 'Актуальные', 'ATSAUKSMES': 'ОТЗЫВЫ', 'ATSAUKSMES UN VĒRTĒJUMI': 'ОТЗЫВЫ И РЕЙТИНГ', 'Ko saka': 'Что говорят', 'pircēji.': 'покупатели.', 'VĒRTĒJUMS': 'ОЦЕНКА', 'KOMENTĀRS': 'КОММЕНТАРИЙ', 'PUBLICĒT ATSAUKSMI': 'ОПУБЛИКОВАТЬ ОТЗЫВ', 'ATJAUNOT ATSAUKSMI': 'ОБНОВИТЬ ОТЗЫВ',
  'KOPĒT SAITI': 'КОПИРОВАТЬ ССЫЛКУ', '✓ SAITE NOKOPĒTA': '✓ ССЫЛКА СКОПИРОВАНА', 'Profila saite nokopēta starpliktuvē.': 'Ссылка на профиль скопирована.', 'Neizdevās nokopēt saiti.': 'Не удалось скопировать ссылку.',
  'REDIĢĒT PROFILU ↗': 'РЕДАКТИРОВАТЬ ПРОФИЛЬ ↗', 'VIDĒJAIS VĒRTĒJUMS': 'СРЕДНИЙ РЕЙТИНГ', 'DALĪBNIEKS KOPŠ': 'УЧАСТНИК С', 'Pieejamas detaļas': 'Доступные запчасти', 'TrackApart kopiena': 'Сообщество TrackApart', 'Vēl nav vērtējumu': 'Пока нет оценок', 'Vēl nav atsauksmju': 'Пока нет отзывов',
  'PĀRSKATS': 'ОБЗОР', 'SLUDINĀJUMI': 'ОБЪЯВЛЕНИЯ', 'SKATĪT': 'СМОТРЕТЬ', 'Jauns pārdevējs': 'Новый продавец',
  '★ AUGSTI NOVĒRTĒTS': '★ ВЫСОКИЙ РЕЙТИНГ', 'AKTĪVS PĀRDEVĒJS': 'АКТИВНЫЙ ПРОДАВЕЦ', 'TAVS PROFILS': 'ВАШ ПРОФИЛЬ', 'TAVA ATSAUKSME': 'ВАШ ОТЗЫВ', 'Tava atsauksme': 'Ваш отзыв',
  'ATSTĀT ATSAUKSMI': 'ОСТАВИТЬ ОТЗЫВ', 'Novērtē pārdevēju': 'Оцените продавца', 'Rediģē savu vērtējumu': 'Изменить вашу оценку', 'Izvēlies zvaigznes': 'Выберите оценку',
  'Slikti': 'Плохо', 'Viduvēji': 'Средне', 'Labi': 'Хорошо', 'Izcili!': 'Отлично!', 'DZĒST': 'УДАЛИТЬ', 'Atsauksme dzēsta.': 'Отзыв удалён.', 'Atsauksme saglabāta!': 'Отзыв сохранён!',
  'Jaunākās': 'Сначала новые', 'Augstākais vērtējums': 'Высокий рейтинг', 'Zemākais vērtējums': 'Низкий рейтинг',
  'Bez komentāra.': 'Без комментария.', 'Nav atsauksmju ar šo vērtējumu.': 'Нет отзывов с такой оценкой.',
  'Dalies ar pieredzi': 'Поделитесь опытом', 'Pieslēdzies savam kontam, lai novērtētu šo pārdevēju.': 'Войдите в аккаунт, чтобы оценить этого продавца.',
  'TAVS PUBLISKAIS PROFILS': 'ВАШ ПУБЛИЧНЫЙ ПРОФИЛЬ', 'Tā tevi redz pircēji': 'Так вас видят покупатели', 'Vari atjaunot savu vārdu, pilsētu un sludinājumus sava konta iestatījumos.': 'Вы можете обновить имя, город и объявления в настройках аккаунта.', 'ATVĒRT MANU KONTU ↗': 'ОТКРЫТЬ МОЙ АККАУНТ ↗',
  'Pievienojies': 'На сайте с', 'pozitīvas': 'положит.', 'atsauksme': 'отзыв', 'atsauksmes': 'отзыва(-ов)', 'Tikai': 'Только', 'ATJAUNOT ATSAUKSMI ↗': 'ОБНОВИТЬ ОТЗЫВ ↗', 'PUBLICĒT ATSAUKSMI ↗': 'ОПУБЛИКОВАТЬ ОТЗЫВ ↗',
  'Izvēlne': 'Меню', 'Aizvērt izvēlni': 'Закрыть меню', 'Aizvērt': 'Закрыть', 'Aizvērt grozu': 'Закрыть корзину', 'Galvenā navigācija': 'Основная навигация', 'Meklēt': 'Поиск', 'Grozs': 'Корзина', 'Profila sadaļas': 'Разделы профиля', 'Vērtējumu sadalījums': 'Распределение оценок', 'Kārtot preces': 'Сортировать товары', 'Kārtot atsauksmes': 'Сортировать отзывы', 'Saglabāt sludinājumu': 'Сохранить объявление', 'Pievienot grozam': 'Добавить в корзину',
  'Ielādē...': 'Загрузка...', 'Ielādējam...': 'Загрузка...', 'Ielogojies, lai publicētu sludinājumu.': 'Войдите, чтобы опубликовать объявление.', 'Lai ievietotu sludinājumu, vispirms ielogojies.': 'Сначала войдите в аккаунт, чтобы разместить объявление.', 'Pārdevējs nav pievienojis aprakstu.': 'Продавец не добавил описание.', 'Nav norādīta': 'Не указано', 'Paldies! Ziņojums nosūtīts administrācijai.': 'Спасибо! Жалоба отправлена модераторам.', 'Izvēlies vērtējumu.': 'Выберите оценку.', 'Vēl nav nevienas atsauksmes.': 'Пока нет ни одного отзыва.', 'Ielogojies, lai atstātu atsauksmi.': 'Войдите, чтобы оставить отзыв.', 'Šim pārdevējam pašlaik nav aktīvu sludinājumu.': 'У этого продавца сейчас нет активных объявлений.', 'BILDES (maks. 10 faili, līdz 5 MB katrs)': 'ФОТОГРАФИИ (макс. 10 файлов, до 5 МБ каждый)', '2FA ir ieslēgta šim kontam.': 'Для этого аккаунта включена 2FA.', '2FA nav ieslēgta šim kontam. Ieteicams pārdevējiem, lai pasargātu kontu no pārņemšanas.': 'Для этого аккаунта 2FA отключена. Рекомендуется продавцам для защиты аккаунта.', 'Konta dzēšana ir neatgriezeniska. Tiks dzēsti tavi sludinājumi, favorīti un profils.': 'Удаление аккаунта необратимо. Ваши объявления, избранное и профиль будут удалены.', 'Šī prece vairs nav pieejama katalogā.': 'Этот товар больше не доступен в каталоге.', 'Veiksmīgi ielogojies.': 'Вход выполнен успешно.', 'Parole atjaunota! Tagad vari izmantot jauno paroli.': 'Пароль обновлён! Теперь можно использовать новый пароль.', 'Ievadi e-pastu un paroli, lai izveidotu kontu.': 'Введите эл. почту и пароль для создания аккаунта.', 'Šis lietotājvārds jau ir aizņemts. Izvēlies citu.': 'Это имя пользователя уже занято. Выберите другое.', 'Tu jau esi ziņojis par šo sludinājumu.': 'Вы уже отправляли жалобу на это объявление.', '404 / LAPA NAV ATRASTA': '404 / СТРАНИЦА НЕ НАЙДЕНА', 'Lapa nav': 'Страница не', 'atrasta.': 'найдена.', 'Adrese': 'Адрес', 'neeksistē vai ir pārvietota.': 'не существует или был перемещён.', 'UZ SĀKUMU': 'НА ГЛАВНУЮ',
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
  'Meklēt pārdevēja detaļās...': "Search seller's parts...",
  'Kā pagāja darījums?': 'How did the deal go?',
  'Apraksti iemeslu (piem., maldinošs apraksts vai aizdomīgs sludinājums)': 'Describe the reason (e.g. misleading listing or suspected scam)',
}

export const placeholderTranslationsRu = {
  'Piem., BMW F10 lukturis vai 63117203298': 'Напр., фара BMW F10 или 63117203298',
  'tavs@epasts.lv': 'vash@email.com',
  'Vismaz 6 simboli': 'Минимум 6 символов',
  'Piem., BMW E46 priekšējais lukturis': 'Напр., передняя фара BMW E46',
  'Rīga, noliktava B3': 'Рига, склад B3',
  'Apraksti detaļas stāvokli un zināmos defektus': 'Опишите состояние детали и известные дефекты',
  'Piem., 2012': 'Напр., 2012',
  'Meklē...': 'Поиск...',
  'Meklēt...': 'Поиск...',
  'Meklē pēc nosaukuma, markas vai modeļa': 'Поиск по названию, марке или модели',
  'Meklēt pārdevēja detaļās...': 'Поиск по запчастям продавца...',
  'Kā pagāja darījums?': 'Как прошла сделка?',
  'Apraksti iemeslu (piem., maldinošs apraksts vai aizdomīgs sludinājums)': 'Опишите причину (напр., недостоверное описание или подозрение на мошенничество)',
}

const DICTS = { en: translations, ru: translationsRu }
const PLACEHOLDER_DICTS = { en: placeholderTranslations, ru: placeholderTranslationsRu }

let currentLang = 'lv'
const translationRequests = new Map()
const originalText = new WeakMap()
let translateTimer = null

export function getLanguage() {
  return currentLang
}

export function isEnglish() {
  return currentLang === 'en'
}

export function isTranslated() {
  return currentLang !== 'lv'
}

export function translateValue(lvText, lang = currentLang) {
  const key = String(lvText ?? '').trim()
  if (!key || lang === 'lv') return key
  const dict = DICTS[lang]
  return dict?.[key] || key
}

export function initLanguage() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    currentLang = SUPPORTED_LANGS.includes(saved) ? saved : 'lv'
  } catch {
    currentLang = 'lv'
  }
  syncDocumentLanguage()
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return
  currentLang = lang
  try {
    localStorage.setItem(LANG_STORAGE_KEY, currentLang)
  } catch {
    // ignore storage errors
  }
  syncDocumentLanguage()
  translatePage()
  primeAndTranslate()
}

export function toggleLanguage() {
  const nextIndex = (SUPPORTED_LANGS.indexOf(currentLang) + 1) % SUPPORTED_LANGS.length
  setLanguage(SUPPORTED_LANGS[nextIndex])
}

export function syncDocumentLanguage(route) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = currentLang
  if (route) {
    const map = getRouteTitles(currentLang)
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
    if (isTranslated()) translatePage()
  }, 60)
}

export async function primeAndTranslate() {
  if (!isTranslated()) return
  translatePage()
  if (currentLang !== 'en') return
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
  if (currentLang === 'en') translatePage()
}

export function syncLanguageSwitchers() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('.lang-opt[data-lang]').forEach((btn) => {
    const active = btn.dataset.lang === currentLang
    btn.classList.toggle('active', active)
    btn.setAttribute('aria-pressed', String(active))
  })
}

export function translatePage() {
  if (typeof document === 'undefined') return
  const dict = DICTS[currentLang] || null
  const phDict = PLACEHOLDER_DICTS[currentLang] || null

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let node
  while ((node = walker.nextNode())) textNodes.push(node)
  textNodes.forEach((textNode) => {
    const original = originalText.get(textNode) || textNode.nodeValue.trim()
    if (!original || textNode.parentElement?.tagName === 'SCRIPT') return
    if (textNode.parentElement?.closest('.tp-select-trigger, .tp-select-popover, .lang-switcher')) return
    if (!originalText.has(textNode)) originalText.set(textNode, original)
    const translated = dict ? dict[original] || original : originalText.get(textNode)
    if (textNode.nodeValue.trim() !== translated) {
      textNode.nodeValue = textNode.nodeValue.replace(textNode.nodeValue.trim(), translated)
    }
  })

  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((input) => {
    if (!input.dataset.lvPlaceholder) input.dataset.lvPlaceholder = input.placeholder
    const lv = input.dataset.lvPlaceholder
    input.placeholder = phDict ? phDict[lv] || lv : lv
  })

  document.querySelectorAll('[aria-label]').forEach((el) => {
    if (el.closest('.tp-select-trigger, .tp-select-popover, .lang-switcher')) return
    if (!el.dataset.lvAriaLabel) el.dataset.lvAriaLabel = el.getAttribute('aria-label') || ''
    const lv = el.dataset.lvAriaLabel
    if (!lv) return
    const next = dict ? dict[lv] || lv : lv
    if (el.getAttribute('aria-label') !== next) el.setAttribute('aria-label', next)
  })

  syncLanguageSwitchers()
  syncAllSelects()
}
