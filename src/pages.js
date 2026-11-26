import { CATEGORIES, getProducts } from './data.js'
import { honeypotFieldMarkup } from './utils.js'
import { productGridMarkup, searchBoxMarkup, sidebarFilterMarkup } from './catalog.js'

export function homeMarkup() {
  const products = getProducts()
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">DETĀĻAS, KURĀM VAR UZTICĒTIES</p>
        <h1>Tava automašīna.<br><em>Mūsu detaļas.</em></h1>
        <p class="hero-text">Pārbaudītas lietotas auto detaļas. Atrastas ātri, nosūtītas droši.</p>
        <a class="button button-light" href="#catalog">SKATĪT KATALOGU <span>↗</span></a>
      </div>
      <div class="hero-visual">
        <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=90" alt="Autosporta auto trasē">
        <div class="hero-label"><span class="live-dot" aria-hidden="true"></span>EST. 2024 <i></i> RĪGA, LV</div>
        <div class="hero-spec">01 <span>TRACKPARTS // OEM TELEMETRY</span></div>
      </div>
      <div class="hero-stats">
        <div><strong>10k+</strong><span>DETAĻAS<br>NOLIKTAVĀ</span></div>
        <div><strong>24h</strong><span>ĀTRA<br>IZSŪTĪŠANA</span></div>
        <div><strong>EU</strong><span>PIEGĀDE<br>VISĀ EIROPĀ</span></div>
      </div>
    </section>
    <div class="racing-stripe"></div>
    <div class="telemetry-marquee" aria-hidden="true">
      <div class="telemetry-track">
        <span><b>●</b> OEM VERIFIED PARTS</span>
        <span><b>//</b> RĪGA WAREHOUSE LIVE</span>
        <span><b>●</b> 24H DISPATCH ACROSS EU</span>
        <span><b>//</b> BMW · AUDI · MERCEDES-BENZ · VW · VOLVO</span>
        <span><b>●</b> INSPECTED BEFORE SHIPMENT</span>
        <span><b>//</b> TRACKPARTS LV</span>
        <span><b>●</b> OEM VERIFIED PARTS</span>
        <span><b>//</b> RĪGA WAREHOUSE LIVE</span>
        <span><b>●</b> 24H DISPATCH ACROSS EU</span>
        <span><b>//</b> BMW · AUDI · MERCEDES-BENZ · VW · VOLVO</span>
        <span><b>●</b> INSPECTED BEFORE SHIPMENT</span>
        <span><b>//</b> TRACKPARTS LV</span>
      </div>
    </div>

    <section class="search-section reveal" id="catalog-preview">
      <div class="section-kicker">01 / ATRODI SAVU DETAĻU</div>
      <div class="search-heading">
        <h2>Ko tu meklē?</h2>
        <p>Meklē pēc nosaukuma, OEM koda vai detaļas numura.</p>
      </div>
      ${searchBoxMarkup()}
    </section>

    <section class="brand-section reveal">
      <div class="section-kicker">MARKAS, KO PAZĪSTAM</div>
      <div class="brand-strip">
        ${['BMW', 'AUDI', 'MERCEDES-BENZ', 'VOLKSWAGEN', 'VOLVO', 'TOYOTA', 'FORD', 'HONDA']
          .map((brand) => `<button type="button" data-brand="${brand.toLowerCase()}">${brand}</button>`)
          .join('')}
      </div>
    </section>

    <section class="category-section reveal">
      <div class="section-top">
        <div>
          <div class="section-kicker">02 / IZPĒTI KATEGORIJAS</div>
          <h2>Viss, kas vajadzīgs<br><em>tavam auto.</em></h2>
        </div>
        <a class="text-link" href="#catalog">SKATĪT VISU <span>↗</span></a>
      </div>
      <div class="category-grid">
        ${CATEGORIES.map(
          ([n, name, icon, value]) =>
            `<a class="category" href="#category-${value.replaceAll(' ', '-')}"><span class="category-number">${n}</span><span class="category-icon">${icon}</span><strong>${name}</strong><span class="arrow">↗</span></a>`,
        ).join('')}
      </div>
    </section>

    <section class="product-section reveal" id="new-arrivals">
      <div class="section-top">
        <div>
          <div class="section-kicker">03 / JAUNUMI NOLIKTAVĀ</div>
          <h2>Pēdējie <em>atradumi.</em></h2>
        </div>
        <a class="text-link" href="#catalog">SKATĪT VISUS <span>↗</span></a>
      </div>
      ${productGridMarkup(products.slice(0, 8))}
    </section>

    <section class="listings-section reveal" id="listings-preview">
      <div class="section-top">
        <div>
          <div class="section-kicker">04 / KOPIENAS SLUDINĀJUMI</div>
          <h2>Ko pārdod<br><em>citi.</em></h2>
        </div>
        <a class="text-link" href="#sell">PĀRDOT SAVU DETAĻU <span>↗</span></a>
      </div>
      <div class="listing-table" id="listing-table">
        <div class="listing-head"><span>DETAĻA</span><span>AUTO</span><span>STĀVOKLIS</span><span>CENA</span><span></span></div>
        <p class="listing-loading">Ielādējam sludinājumus...</p>
      </div>
    </section>

    <section class="trust-section reveal">
      <div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katra detaļa tiek apskatīta pirms nosūtīšanas.</p></div>
      <div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No mūsu noliktavas Rīgā līdz tavām durvīm.</p></div>
      <div><span class="trust-icon">◷</span><strong>Atbalsts 7 dienas</strong><p>Zini, ko pērc. Mēs palīdzēsim atrast pareizo.</p></div>
    </section>
  `
}

export function catalogPageMarkup() {
  const products = getProducts()
  return `<section class="page-hero">
    <div class="section-kicker">02 / PREČU KATALOGS</div>
    <h1>Atrodi detaļu.<br><em>Uztaisi ātrāku.</em></h1>
    <p>Oriģinālas un pārbaudītas detaļas ielas auto, trases projektam un servisam.</p>
  </section>
  <section class="catalog-layout catalog-page reveal">
    <aside class="catalog-sidebar" id="catalog-sidebar">${sidebarFilterMarkup()}</aside>
    <div class="catalog-main">
      <div class="catalog-main-top">
        <span class="catalog-count" id="sidebar-catalog-count">${products.length} <span>PRECES</span></span>
        <select id="sidebar-sort-select" aria-label="Kārtot preces">
          <option value="">Jaunākie</option>
          <option value="price-asc">Cena: no zemākās</option>
          <option value="price-desc">Cena: no augstākās</option>
        </select>
      </div>
      ${productGridMarkup(products, true)}
    </div>
  </section>`
}

export const STATIC_PAGES = {
  about: `<section class="page-hero about-hero">
    <div class="section-kicker">03 / PAR TRACKPARTS</div>
    <h1>Built for the<br><em>road ahead.</em></h1>
    <p>Mēs atrodam labas detaļas cilvēkiem, kuri paši zina, cik svarīgs ir katrs pagrieziens.</p>
  </section>
  <section class="story-section reveal">
    <div class="section-kicker">MŪSU PIEEJA</div>
    <h2>Nevis detaļu kaudze.<br><em>Īstais atradums.</em></h2>
    <div class="story-grid">
      <p>TrackParts sākās Rīgā ar vienu vienkāršu ideju: lietotai detaļai nav jābūt kompromisam. Katra detaļa tiek pārbaudīta, nofotografēta un marķēta, lai tu vari pirkt ar pārliecību.</p>
      <p>Mūsu noliktavā katram kodam ir sava vieta, statuss un vēsture. Mazāk minēšanas, vairāk laika uz ceļa.</p>
    </div>
  </section>
  <section class="trust-section reveal">
    <div><span class="trust-icon">✦</span><strong>Pārbaudīta kvalitāte</strong><p>Katrs produkts tiek apskatīts pirms pārdošanas.</p></div>
    <div><span class="trust-icon">↝</span><strong>Piegāde Eiropā</strong><p>No Rīgas līdz tavām durvīm.</p></div>
    <div><span class="trust-icon">◷</span><strong>Cilvēcīgs atbalsts</strong><p>Palīdzēsim atrast pareizo detaļu.</p></div>
  </section>`,

  contact: `<section class="page-hero contact-hero">
    <div class="section-kicker">04 / SAZINĀSIMIES</div>
    <h1>Ir jautājums?<br><em>Dod ziņu.</em></h1>
    <p>Neatrodi detaļu katalogā? Atsūti VIN, OEM kodu vai bildi, un mēs paskatīsimies.</p>
  </section>
  <section class="contact-section reveal">
    <div>
      <div class="section-kicker">RAKSTI MUMS</div>
      <h2>Atbildēsim<br><em>ātri.</em></h2>
    </div>
    <div class="contact-list">
      <a href="mailto:hello@trackparts.lv"><small>E-PASTS</small>hello@trackparts.lv ↗</a>
      <a href="tel:+37120000000"><small>TELEFONS</small>+371 2000 0000 ↗</a>
      <div><small>ATRODI MŪS</small>Rīga, Latvija</div>
    </div>
  </section>`,

  terms: `<section class="page-hero">
    <div class="section-kicker">LIETOŠANAS NOTEIKUMI</div>
    <h1>Noteikumi.<br><em>Skaidri un godīgi.</em></h1>
    <p>Šie noteikumi regulē TrackParts interneta veikala un sludinājumu platformas lietošanu.</p>
  </section>
  <section class="legal-page">
    <small class="legal-updated">Pēdējo reizi atjaunots: 2026. gada augustā</small>
    <p class="legal-lang-note">Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.</p>
    <h3>1. Vispārīga informācija</h3>
    <p>Šo tīmekļa vietni ("TrackParts", "mēs") uztur [UZŅĒMUMA NOSAUKUMS / KOMERSANTA VĀRDS, REĢ. NR. XXXXXXXXXXX, JURIDISKĀ ADRESE], turpmāk — "Pārdevējs" vai "Operators". Lietojot vietni, tu piekrīti šiem noteikumiem. Ja nepiekrīti, lūdzu, nelieto vietni.</p>
    <h3>2. Konta reģistrācija</h3>
    <p>Reģistrējoties tu apliecini, ka sniegtā informācija ir patiesa un ka tev ir vismaz 18 gadu, vai arī rīkojies ar likumiskā pārstāvja piekrišanu. Tu esi atbildīgs par sava konta datu konfidencialitāti un visām darbībām, kas veiktas, izmantojot tavu kontu.</p>
    <h3>3. Pasūtījumi un cenas</h3>
    <p>Cenas norādītas eiro (€) un, ja piemērojams, ietver PVN. Interneta apmaksa pašlaik nav pieejama — pēc pasūtījuma pieprasījuma nosūtīšanas mēs sazināmies ar tevi pa e-pastu, lai vienotos par apmaksu un piegādi. Līgums starp pusēm uzskatāms par noslēgtu tikai pēc abpusējas apmaksas un piegādes nosacījumu apstiprināšanas.</p>
    <h3>4. Atteikuma tiesības (14 dienas)</h3>
    <p>Ja esi patērētājs (fiziska persona, kas pērk ārpus savas saimnieciskās darbības), tev ir tiesības atteikties no pirkuma 14 kalendāro dienu laikā no preces saņemšanas dienas, nenorādot iemeslu, saskaņā ar Patērētāju tiesību aizsardzības likumu un ES Direktīvu 2011/83/ES. Lai izmantotu šīs tiesības, raksti mums uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>. Nauda tiek atmaksāta 14 dienu laikā pēc preces saņemšanas atpakaļ. Preces atpakaļsūtīšanas izmaksas sedz pircējs, ja vien nav norādīts citādi. Prece jāatdod tādā stāvoklī, kāds nepieciešams tās īpašību un darbības pārbaudei.</p>
    <h3>5. Kopienas sludinājumi</h3>
    <p>Reģistrēti lietotāji var publicēt savus sludinājumus. Par sludinājuma saturu, precizitāti un preces stāvokli atbild attiecīgais lietotājs — TrackParts darbojas kā starpnieks (informācijas sabiedrības pakalpojumu sniedzējs) un neveic katras detaļas fizisku pārbaudi pirms publicēšanas. Aizliegts publicēt maldinošu, nelikumīgu vai trešo personu tiesības aizskarošu saturu. Mēs paturam tiesības noņemt sludinājumus, kas pārkāpj šos noteikumus.</p>
    <h3>6. Atbildības ierobežojums</h3>
    <p>Mēs nenesam atbildību par netiešiem zaudējumiem, kas radušies vietnes lietošanas rezultātā, izņemot gadījumos, kad atbildību nevar ierobežot saskaņā ar piemērojamiem tiesību aktiem (piemēram, par miesas bojājumiem vai krāpšanu).</p>
    <h3>7. Strīdu risināšana</h3>
    <p>Šiem noteikumiem piemērojami Latvijas Republikas tiesību akti. Ja rodas strīds, vispirms sazinies ar mums tieši. Patērētāji var vērsties arī Patērētāju tiesību aizsardzības centrā (<a href="https://www.ptac.gov.lv" target="_blank" rel="noreferrer">ptac.gov.lv</a>) vai izmantot ES Strīdu izšķiršanas tiešsaistes platformu (<a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>).</p>
    <h3>8. Grozījumi</h3>
    <p>Mēs varam šos noteikumus laiku pa laikam atjaunot. Būtiskas izmaiņas tiks paziņotas vietnē. Turpinot lietot vietni pēc izmaiņām, tu piekrīti atjauninātajiem noteikumiem.</p>
    <h3>9. Kontakti</h3>
    <p>Jautājumu gadījumā raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a> vai zvani +371 2000 0000.</p>
  </section>`,

  privacy: `<section class="page-hero">
    <div class="section-kicker">PRIVĀTUMA POLITIKA</div>
    <h1>Tavi dati.<br><em>Mūsu atbildība.</em></h1>
    <p>Šī politika izskaidro, kādus personas datus TrackParts apstrādā un kāpēc, saskaņā ar Vispārīgo datu aizsardzības regulu (VDAR/GDPR).</p>
  </section>
  <section class="legal-page">
    <small class="legal-updated">Pēdējo reizi atjaunots: 2026. gada augustā</small>
    <p class="legal-lang-note">Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.</p>
    <h3>1. Pārzinis</h3>
    <p>Par tavu personas datu apstrādi atbild [UZŅĒMUMA NOSAUKUMS / KOMERSANTA VĀRDS, REĢ. NR. XXXXXXXXXXX, JURIDISKĀ ADRESE]. Jautājumos par datu apstrādi raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>.</p>
    <h3>2. Kādus datus mēs apstrādājam</h3>
    <ul>
      <li>Konta dati: e-pasts, parole (šifrētā veidā), lietotājvārds, vārds, tālrunis, pilsēta.</li>
      <li>Sludinājumu dati: viss, ko norādi, publicējot sludinājumu (nosaukums, cena, apraksts, fotogrāfijas, atrašanās vieta).</li>
      <li>Pasūtījumu dati: vārds, e-pasts, tālrunis, piegādes adrese, piezīmes.</li>
      <li>Tehniskie dati: pieslēgšanās sesijas informācija, ko pārlūkprogramma glabā lokāli, lai tu paliktu ielogojies.</li>
    </ul>
    <h3>3. Apstrādes nolūki un tiesiskais pamats</h3>
    <p>Datus apstrādājam, lai izpildītu ar tevi noslēgto līgumu (konta izveide, pasūtījumu un sludinājumu apstrāde) — VDAR 6. panta 1. daļas (b) punkts, kā arī lai nodrošinātu vietnes drošību un novērstu ļaunprātīgu izmantošanu — leģitīmās intereses, VDAR 6. panta 1. daļas (f) punkts. Mēs nesūtām mārketinga e-pastus un neizmantojam tavus datus reklāmas mērķiem.</p>
    <h3>4. Datu glabāšanas termiņš</h3>
    <p>Datus glabājam, kamēr tavs konts ir aktīvs. Ja pieprasi konta dzēšanu, tavus personas datus dzēšam vai anonimizējam saprātīgā termiņā, izņemot datus, kurus mums jāglabā ilgāk saskaņā ar likumu (piemēram, grāmatvedības dokumentus).</p>
    <h3>5. Datu saņēmēji</h3>
    <p>Tavus datus glabā un apstrādā Supabase (datubāzes, autentifikācijas un faila glabāšanas pakalpojumu sniedzējs) kā mūsu datu apstrādātājs. Datus nepārdodam un nekopīgojam ar trešajām personām reklāmas nolūkos.</p>
    <h3>6. Tavas tiesības</h3>
    <p>Tev ir tiesības pieprasīt piekļuvi saviem datiem, to labošanu, dzēšanu, apstrādes ierobežošanu, iebilst pret apstrādi un saņemt datus pārnesamā formātā. Lai izmantotu šīs tiesības, raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>. Ja uzskati, ka tavas tiesības ir pārkāptas, vari iesniegt sūdzību Datu valsts inspekcijā (<a href="https://www.dvi.gov.lv" target="_blank" rel="noreferrer">dvi.gov.lv</a>).</p>
    <h3>7. Sīkdatnes un lokālā glabātuve</h3>
    <p>Vietne izmanto tikai tehniski nepieciešamu pārlūkprogrammas lokālo glabātuvi (local storage), lai uzturētu tavu pieslēgšanās sesiju un valodas izvēli. Mēs neizmantojam analītikas vai reklāmas sīkdatnes.</p>
    <h3>8. Kontakti</h3>
    <p>Jautājumu vai lūgumu gadījumā par saviem datiem raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>.</p>
  </section>`,

  marketplace: `<section class="page-hero">
    <div class="section-kicker">TIRDZNIECĪBAS NOTEIKUMI</div>
    <h1>Tirgus noteikumi.<br><em>Godīga spēle visiem.</em></h1>
    <p>Papildu noteikumi, kas regulē detaļu ievietošanu un tirdzniecību TrackParts kopienas sludinājumos.</p>
  </section>
  <section class="legal-page">
    <small class="legal-updated">Pēdējo reizi atjaunots: 2026. gada augustā</small>
    <p class="legal-lang-note">Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.</p>
    <h3>1. Piemērošana</h3>
    <p>Šie tirdzniecības noteikumi papildina TrackParts <a href="#terms">Lietošanas noteikumus</a> un attiecas konkrēti uz kopienas lietotāju ievietotajiem sludinājumiem (nevis uz precēm, ko tieši pārdod TrackParts katalogā). Publicējot vai apskatot sludinājumu, tu piekrīti šiem noteikumiem.</p>
    <h3>2. Kas drīkst pārdot</h3>
    <p>Sludinājumu var ievietot ikviens reģistrēts lietotājs, kuram ir vismaz 18 gadu un likumīgas tiesības pārdot norādīto detaļu (tā pieder tev vai tev ir īpašnieka atļauja to pārdot tavā vārdā).</p>
    <h3>3. Ko drīkst ievietot</h3>
    <ul>
      <li>Tikai reālas, tev piederošas auto detaļas, kuru izcelsme ir likumīga.</li>
      <li>Precīzu un patiesu aprakstu — stāvokli, defektus, OEM/ražotāja kodu, ja tas zināms.</li>
      <li>Pašuzņemtas fotogrāfijas, kas parāda reālo preci, ne kopētas no interneta.</li>
      <li>Godīgu, tirgum atbilstošu cenu.</li>
    </ul>
    <h3>4. Kas ir aizliegts</h3>
    <ul>
      <li>Zagtu, viltotu vai bez likumīga pamata iegūtu detaļu pārdošana.</li>
      <li>Maldinošs vai apzināti nepatiess apraksts, cena vai fotogrāfijas.</li>
      <li>Dublēti vai spama sludinājumi, kā arī sludinājumi par precēm, kas nav auto detaļas.</li>
      <li>Kontaktinformācijas vākšana, uzmākšanās citiem lietotājiem vai mēģinājumi pārcelt darījumu ārpus platformas krāpnieciskā nolūkā.</li>
      <li>Naida runa, aizskaroši vai citu personu tiesības pārkāpjoši materiāli.</li>
    </ul>
    <h3>5. TrackParts loma darījumā</h3>
    <p>Kopienas sludinājumos TrackParts darbojas tikai kā starpnieks — savienojam pircēju ar pārdevēju, bet nepiedalāmies maksājumā, piegādē vai preces apskatē pirms publicēšanas. Vienošanās par cenu, apmaksu un nodošanu notiek tieši starp pircēju un pārdevēju, un abas puses par to ir pilnībā atbildīgas. Sk. arī mūsu <a href="#safety">Drošības ieteikumus</a> drošam darījumam.</p>
    <h3>6. Moderācija un sludinājumu noņemšana</h3>
    <p>Mēs paturam tiesības pārskatīt, rediģēt pieprasīt vai bez brīdinājuma noņemt sludinājumus, kas pārkāpj šos noteikumus, kā arī apturēt vai dzēst lietotāja kontu smagu vai atkārtotu pārkāpumu gadījumā (piemēram, aizdomas par zagtu preci vai krāpšanu).</p>
    <h3>7. Ziņošana par pārkāpumiem</h3>
    <p>Ja pamani sludinājumu vai lietotāju, kas pārkāpj šos noteikumus, izmanto pogu "Ziņot par sludinājumu" attiecīgā sludinājuma lapā vai raksti mums uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a>.</p>
    <h3>8. Kontakti</h3>
    <p>Jautājumu gadījumā raksti uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a> vai zvani +371 2000 0000.</p>
  </section>`,

  safety: `<section class="page-hero">
    <div class="section-kicker">DROŠĪBA</div>
    <h1>Droši darījumi.<br><em>Tavai drošībai.</em></h1>
    <p>Ieteikumi, kā droši pirkt un pārdot TrackParts kopienas sludinājumos.</p>
  </section>
  <section class="legal-page">
    <small class="legal-updated">Pēdējo reizi atjaunots: 2026. gada augustā</small>
    <p class="legal-lang-note">Šis dokuments pieejams tikai latviešu valodā. Ja nepieciešams tulkojums, sazinies ar mums.</p>
    <h3>1. Vispārīgi</h3>
    <p>Kopienas sludinājumos darījums notiek tieši starp diviem lietotājiem. TrackParts negarantē pārdevēja identitāti, preces stāvokli vai darījuma norisi. Šie ieteikumi palīdzēs samazināt risku, pērkot vai pārdodot.</p>
    <h3>2. Pirms tikšanās</h3>
    <p>Pārrunā detaļas ar otru pusi rakstiski — precīzu preces stāvokli, cenu un saderību (VIN, OEM numurs, modelis, gads). Lūdz papildu fotogrāfijas, ja kaut kas nav skaidrs.</p>
    <h3>3. Tiekoties klātienē</h3>
    <p>Izvēlies drošu, publisku un labi apgaismotu vietu, ideālā gadījumā dienas laikā. Ja iespējams, ņem līdzi kādu citu. Izvairies doties vienatnē uz nomaļu vietu, īpaši, ja darījuma summa ir liela.</p>
    <h3>4. Pārbaudi preci pirms apmaksas</h3>
    <p>Salīdzini detaļas numuru un stāvokli ar sludinājumā redzamo. Ja iespējams, pārbaudi detaļu vai pielaikojot to. Nemaksā, pirms neesi preci redzējis un apstiprinājis, ka tā atbilst aprakstam.</p>
    <h3>5. Maksājumi</h3>
    <p>Priekšroku dod skaidrai naudai pēc preces apskates vai citam drošam maksājuma veidam. Nekad nesūti avansu vai pilnu summu nepazīstamam pārdevējam, īpaši ar bankas pārskaitījumu, kriptovalūtu vai dāvanu kartēm, ja precīti neesi redzējis. Uzmanies no steidzināšanas ("jāmaksā tagad, citādi detaļu nopirks cits") — tas ir bieži sastopams krāpšanas paņēmiens. Nekad nedalies ar bankas kartes datiem, PIN kodiem vai vienreizējiem apstiprinājuma kodiem.</p>
    <h3>6. Sūtīšana un attālināti darījumi</h3>
    <p>Ja prece tiek sūtīta, izmanto izsekojamu kurjerpakalpojumu un vienojies par apmaksu tikai pēc sūtījuma apstiprināšanas. Esi piesardzīgs, ja cena šķiet neparasti zema salīdzinājumā ar tirgu — tas var liecināt par krāpšanu.</p>
    <h3>7. Brīdinājuma pazīmes</h3>
    <ul>
      <li>Pārdevējs izvairās no zvana vai video sarunas.</li>
      <li>Uzstāj uz maksājumu ārpus platformas vai pirms preces apskates.</li>
      <li>Atsakās tikties klātienē vai sniegt papildu fotogrāfijas.</li>
      <li>Prasa personisku finanšu informāciju, kas darījumam nav nepieciešama.</li>
    </ul>
    <h3>8. Ja kaut kas noiet greizi</h3>
    <p>Raksti mums uz <a href="mailto:hello@trackparts.lv">hello@trackparts.lv</a> ar sludinājuma saiti un aprakstu, lai varam izvērtēt un rīkoties. Ja aizdomas par krāpšanu, vērsies arī Valsts policijā (tālr. 110) vai Patērētāju tiesību aizsardzības centrā (<a href="https://www.ptac.gov.lv" target="_blank" rel="noreferrer">ptac.gov.lv</a>).</p>
    <h3>9. Atšķirība no veikala pirkumiem</h3>
    <p>Kopienas sludinājumi ir darījumi starp privātpersonām un uz tiem <strong>neattiecas</strong> 14 dienu atteikuma tiesības, kas pieejamas, pērkot tieši no TrackParts kataloga (sk. <a href="#terms">Lietošanas noteikumu</a> 4. punktu). Pirms pirkuma pārliecinies, ka esi ar to iepazinies.</p>
  </section>`,

  account: `<section class="page-hero">
    <div class="section-kicker">05 / TAVS KONTS</div>
    <h1>Pieslēdzies.<br><em>Pārdod.</em></h1>
    <p>Izveido kontu, lai ievietotu detaļas un pārvaldītu savus sludinājumus.</p>
  </section>
  <section class="form-section">
    <div id="account-content">
      <form class="site-form" id="auth-form">
        ${honeypotFieldMarkup()}
        <div class="section-kicker">LIETOTĀJA PIEKĻUVE</div>
        <h2>Ienākt vai <em>reģistrēties.</em></h2>
        <label>E-PASTS<input type="email" name="email" required placeholder="tavs@epasts.lv"></label>
        <label>PAROLE<input type="password" name="password" required minlength="6" placeholder="Vismaz 6 simboli"></label>
        <label class="consent-label"><input type="checkbox" name="consent"><span>Piekrītu <a href="#terms">Lietošanas noteikumiem</a> un <a href="#privacy">Privātuma politikai</a> (nepieciešams, veidojot jaunu kontu).</span></label>
        <div class="form-actions">
          <button class="button button-dark" type="submit">IELOGOTIES ↗</button>
          <button class="text-button" id="signup-button" type="button">IZVEIDOT KONTU</button>
          <button class="text-button" id="forgot-password" type="button">AIZMIRSI PAROLI?</button>
        </div>
        <p class="form-message" id="auth-message"></p>
      </form>
    </div>
  </section>`,

  sell: `<section class="page-hero">
    <div class="section-kicker">06 / JAUNS SLUDINĀJUMS</div>
    <h1>Ieliec detaļu<br><em>uz ceļa.</em></h1>
    <p>Aizpildi informāciju, pievieno bildes un sasniedz cilvēku, kuram tā vajadzīga.</p>
  </section>
  <section class="form-section">
    <form class="site-form listing-form" id="listing-form">
      ${honeypotFieldMarkup()}
      <div class="section-kicker">DETAĻAS INFORMĀCIJA</div>
      <h2>Ko tu <em>pārdod?</em></h2>
      <label>NOSAUKUMS<input name="title" required placeholder="Piem., BMW E46 priekšējais lukturis"></label>
      <div class="form-two">
        <label>CENA (€)<input name="price" type="number" min="0" step="0.01" required placeholder="250"></label>
        <label>OEM NUMURS<input name="oem_number" placeholder="63117203298"></label>
      </div>
      <div class="form-two">
        <label>MARKA<input name="brand" placeholder="BMW"></label>
        <label>MODELIS<input name="model" placeholder="E46"></label>
      </div>
      <div class="form-two">
        <label>GADS<input name="production_year" type="number" min="1950" max="2030" placeholder="2014"></label>
        <label>DZINĒJS<input name="engine" placeholder="530d / 3.0 TDI"></label>
      </div>
      <div class="form-two">
        <label>KATEGORIJA<select name="category">${CATEGORIES.map((c) => `<option>${c[4]}</option>`).join('')}</select></label>
        <label>ATRAŠANĀS VIETA<input name="location" placeholder="Rīga, noliktava B3"></label>
      </div>
      <label>STĀVOKLIS<select name="condition"><option value="very_good">Ļoti labs</option><option value="good">Labs</option><option value="defect">Ar defektu</option></select></label>
      <label>APRAKSTS<textarea name="description" rows="5" placeholder="Apraksti detaļas stāvokli un zināmos defektus"></textarea></label>
      <label>BILDES (maks. 10 faili, līdz 5 MB katrs)<input name="images" type="file" accept="image/*" multiple required></label>
      <div class="form-actions"><button class="button button-dark" type="submit">PUBLICĒT SLUDINĀJUMU ↗</button></div>
      <p class="form-message" id="listing-message"></p>
    </form>
  </section>`,
}
