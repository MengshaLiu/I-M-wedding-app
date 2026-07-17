from fastapi import APIRouter, Depends

from app.deps import require_full_tier
from app.schemas import TravelItem, TravelResponse, TravelSection

router = APIRouter(prefix="/api")

# ── Travel guide content — edit here to update the site ─────────────────────
TRAVEL_CONTENT = [
    TravelSection(
        title="Places to Visit",
        items=[
            TravelItem(
                name="Gaya Street",
                description="One of KK's oldest and most characterful streets, Gaya Street is lined with heritage shophouses housing a eclectic mix of local cafes, provision shops, pharmacies, and traders that have been serving the community for generations. Its unhurried, old-town atmosphere makes it one of the most authentic corners of the city.",
                tip="The famous Sunday Market takes over Gaya Street every week — go early as stalls start packing up by midday.",
                link="https://www.google.com/maps/search/Gaya+Street+Kota+Kinabalu",
            ),
            TravelItem(
                name="Kota Kinabalu City Mosque",
                description="One of Malaysia's most beautiful mosques, set beside a lagoon. The golden domes glow magnificently at sunset.",
                tip="Visit at dusk for golden reflections on the water.",
                link="https://www.google.com/maps/search/Kota+Kinabalu+City+Mosque",
            ),
            TravelItem(
                name="Rafflesia Information Centre",
                description="Dedicated to one of the world's most extraordinary flowers, this centre sits within the rainforest outside KK and serves as the starting point for guided walks in search of the rare Rafflesia — the largest bloom on earth, known for its striking crimson petals and remarkable size. Informative displays explain the flower's unique parasitic nature and the conservation efforts protecting it across Sabah.",
                tip="Rafflesia blooms are unpredictable and last only 5–7 days — call ahead to confirm there is an active bloom before making the trip out.",
                link="https://www.google.com/maps/search/Rafflesia+Information+Centre+Kota+Kinabalu+Sabah",
            ),
            TravelItem(
                name="Kinabalu Park",
                description="UNESCO World Heritage Site and home to Mt Kinabalu (4,095 m), Southeast Asia's highest peak.",
                tip="Book a guided summit trek well in advance — permits fill months ahead.",
                link="https://www.google.com/maps/search/Kinabalu+Park+Sabah",
            ),
            TravelItem(
                name="Mari Mari Cultural Village",
                description="A living open-air museum where guides from Sabah's indigenous communities demonstrate traditional food, music, dance, and blowpipe skills.",
                tip="The afternoon session ends with a lively cultural show — worth timing your visit around it.",
                link="https://www.google.com/maps/search/Mari+Mari+Cultural+Village+Kota+Kinabalu",
            )
        ],
    ),
    TravelSection(
        title="Things to Eat",
        items=[
            TravelItem(
                name="Fook Yuen Cafe & Bakery",
                description="A KK institution and the go-to kopitiam for locals and visitors alike, Fook Yuen on Gaya Street has been serving up honest, no-frills Malaysian breakfast since the early hours of the morning. The self-service setup is part of the charm — grab a table, order your drinks at the counter, and load up your tray with dim sum, noodles, and freshly baked goods from the spread. Open from 6am until late, it fits any hour of the day.",
                tip="Don't leave without trying the Roti Kahwin — their house-baked bread toasted and slathered with kaya and butter — paired with a classic Teh C. Simple, cheap, and genuinely delicious.",
                link="https://www.google.com/maps/place/Fook+Yuen+%7C+Gaya+Street/@5.9851393,116.0758101,17z/data=!3m1!4b1!4m5!3m4!1s0x323b6985ef29398b:0x999f83232d94e7ba!8m2!3d5.985134!4d116.0779988",
            ),
            TravelItem(
                name="Kedai Kopi Jia Siang",
                description="A long-standing kopitiam in Lintas that has become one of KK's most well-known spots for Sang Nyuk Mee — the beloved Sabah-style pork noodle that locals have been eating since the Jesselton days. Established since 1997, Jia Siang serves up bowls of tender pork slices, juicy handmade pork balls, and springy noodles in a rich, flavourful broth — available either in soup or dry kon lau style. A no-frills, satisfying meal that draws a steady crowd of regulars from morning through to the late hours.",
                tip="Open until 2am — making it one of the best supper spots in KK after a night out. Order the Kon Lou Mee dry style and pair it with their signature chili sauce for the full experience.",
                link="https://www.google.com/maps/?cid=13562141638734177505",
            ),
            TravelItem(
                name="Kopitiam Asam Pedas (KAP)",
                description="A beloved local seafood kopitiam that has earned a cult following in KK for its bold, fiery asam pedas — the distinctly Malaysian hot and sour broth that locals can't get enough of. Tucked inside Wisma Merdeka, the menu centres around fresh seafood prepared with vibrant, tangy flavours — from the signature Asam Pedas soup loaded with your choice of fish to stir-fried seafood noodles and hearty side dishes. Unpretentious, affordable, and always packed with locals.",
                tip="The Asam Pedas soup is the star — order it with fresh fish and a bowl of steamed rice. Fair warning: it lives up to its name, so let them know if you prefer it less spicy.",
                link="https://www.google.com/maps/search/Kopitiam+Asam+Pedas+KAP+Wisma+Merdeka+Kota+Kinabalu",
            ),
            TravelItem(
                name="Sasa Seafood Restaurant",
                description="A local seafood institution in Penampang, just a short drive from the city centre, Sasa has earned its reputation as one of KK's go-to spots for fresh, affordable seafood. Its name combines the first syllables of Sabah and Sarawak — a nod to its Borneo roots. The sprawling restaurant buzzes with locals most evenings, and the tanks of live seafood tell you everything about the freshness of what lands on your table. From buttery crabs and boiled prawns to steamed grouper and stir-fried jungle fern, the menu covers all the classics done well.",
                tip="Air-conditioned rooms are available including a private room that fits up to 30 people — ideal for family dinners or group gatherings. Book ahead on weekends as it fills up fast.",
                link="https://www.google.com/maps/search/Sasa+Seafood+Restaurant+Penampang+Kota+Kinabalu",
            ),
            TravelItem(
                name="A1 Chicken Rice",
                description="A KK homegrown success story that started as a humble food stall in Lintas in 2010 and has since grown into one of the most recognised chicken rice brands in Sabah. Founded by a dedicated couple with decades of culinary experience, A1 serves up tender roasted and poached chicken over fragrant rice — all made from their own home recipes using fresh local chicken. Pork-free and welcoming to all, it has become a firm favourite among locals and visitors alike, with multiple outlets across the city.",
                tip="The signature Roasted Chicken Rice is the must-order — juicy, flavourful, and consistently good. The Honey Sesame Chicken is another crowd favourite worth trying if you want something a little different.",
                link="https://www.google.com/maps/search/A1+Chicken+Rice+Lintas+Plaza+Kota+Kinabalu",
            ),
            TravelItem(
                name="KK Durian Paradise",
                description="If you've never tried durian, Kota Kinabalu is one of the best places to do it — and KK Durian Paradise is where the locals go. This open-air durian stall is a beloved institution, drawing crowds of durian devotees who come to feast on Sabah's finest varieties straight from the husk. The passionate team knows their fruit inside out and will happily help you pick the right variety for your palate — from creamy and bittersweet to rich and custard-like. Eating durian here, under the night sky with cold coconut water in hand, is a quintessentially Sabahan experience.",
                tip="Go with an open mind — durian is an acquired taste, but the right variety can be a revelation. Ask the staff to recommend something mild if it's your first time. Best enjoyed in the evening when it's cooler.",
                link="https://www.google.com/maps/search/KK+Durian+Paradise+Kota+Kinabalu",
            ),
        ],
    ),
    TravelSection(
        title="Where to Shop",
        items=[
            TravelItem(
                name="Imago Shopping Mall",
                description="KK's most modern mall with over 300 stores across four levels — international brands, local fashion, a cinema, and a good food hall. Handy for last-minute essentials or an air-conditioned afternoon browse.",
                tip="The basement supermarket stocks local snacks, Tenom coffee, and Sabah tea — perfect for edible souvenirs.",
                link="https://www.google.com/maps/search/Imago+Shopping+Mall+KK+Times+Square+Kota+Kinabalu",
            ),
            TravelItem(
                name="Wisma Merdeka",
                description="One of KK's oldest waterfront malls, Wisma Merdeka is a haven for local stores — think homegrown boutiques, independent retailers, and specialty shops you won't find in any chain mall. Its relaxed, neighbourhood feel makes it a refreshing contrast to the city's newer commercial centres.",
                tip="A good place for money changers in KK — rates here consistently beat the airport and hotel counters, so stock up on ringgit before heading out.",
                link="https://www.google.com/maps/search/Wisma+Merdeka+Kota+Kinabalu",
            ),
            TravelItem(
                name="Suria Sabah",
                description="Suria Sabah sits right in the heart of the city near gaya street and spans multiple levels of retail, dining, and entertainment. A solid mix of international brands, local fashion labels, electronics, and lifestyle stores makes it the go-to destination for serious shopping — all under one roof with strong air-conditioning to escape the tropical heat.",
                tip="A great one-stop destination — shop the many retail floors then refuel at the wide range of restaurants and eateries covering everything from local Sabahan flavours to international cuisines.",
                link="https://www.google.com/maps/search/Suria+Sabah",
            ),
            TravelItem(
                name="The Art Attic",
                description="Tucked along Lorong Dewan just a short stroll from Gaya Street, The Art Attic is KK's most beloved arts and lifestyle concept space — part gallery, part gift shop, part creative workshop hub. Set across a spacious, chic industrial interior, it showcases a carefully curated collection of handmade crafts, paintings, jewellery, homeware, clothing, and fine art — all created by local Sabahan artists and designers. A refreshing alternative to souvenir shops, every piece here carries a genuine story.",
                tip="There's a cosy café inside — grab a drink and take your time browsing the art without feeling rushed.",
                link="https://www.google.com/maps/search/The+Art+Attic,+7+Lorong+Dewan,+Kota+Kinabalu",
            ),
            TravelItem(
                name="Salt x Paper Stationery & Gifts",
                description="A delightful stationery and gift boutique right on Jalan Gaya, Salt x Paper is a KK institution lovingly nicknamed 'stationery heaven' by locals. Founded by a creative couple with a passion for paper goods, the store is beautifully curated with designer notebooks, greeting cards, washi tape, stickers, postcards, and quirky collectibles — many featuring original illustrations by local Sabahan artists. Every corner is an aesthetic treat and dangerously easy to overspend in.",
                link="https://www.google.com/maps/search/Salt+x+Paper,+51+Jalan+Gaya,+Kota+Kinabalu",
            ),
        ],
    ),
    TravelSection(
        title="Entertainment & Activities",
        items=[
            TravelItem(
                name="Island Hopping & Snorkelling",
                description="Hop between the five islands of Tunku Abdul Rahman Marine Park — white sand, coral reefs, and clear turquoise water just a short boat ride from the city.",
                tip="Mantanani Island and Manukan Island are highly recommended for a day trip.",
                link="https://www.google.com/maps/search/Tunku+Abdul+Rahman+Marine+Park+Kota+Kinabalu",
            ),
            TravelItem(
                name="Sunset at Tanjung Aru",
                description="The west-facing beach at Tanjung Aru serves up some of the most celebrated sunsets in all of Malaysia. Our venue sits right on this stretch.",
                tip="Come early for a beach walk before the sky turns — it peaks fast.",
                link="https://www.google.com/maps/search/Tanjung+Aru+Beach+Kota+Kinabalu",
            ),
            TravelItem(
                name="Bongawan River Cruise — Proboscis Monkey & Fireflies Mangrove",
                description="A full-day cruise through Bongawan's mangrove wetlands, about 1.5 hours from KK. Spot proboscis monkeys feeding at the riverbanks in the afternoon, catch the Sky Mirror sunset at Bongawan Beach, then drift back through the mangroves as fireflies light up the trees like strings of fairy lights.",
                tip="Book early — spots fill fast and the experience runs rain or shine. Afternoon tea and dinner are usually included in package tours.",
            ),
            TravelItem(
                name="Spa & Massage",
                description="After days of island hopping, jungle trekking, and exploring the city on foot, KK has no shortage of places to unwind. From budget-friendly reflexology centres tucked above shophouses to indulgent full-body treatments at resort spas, the city caters to every level of relaxation and budget. Traditional Malay massage, Thai massage, aromatherapy, and foot reflexology are all widely available — and remarkably affordable compared to most cities.",
                tip="Attiya Spa KK and Natura Spa & Wellness KK are both highly recommended by locals and travellers alike.",
            ),
        ],
    ),
    TravelSection(
        title="Before You Enter Malaysia",
        items=[
            TravelItem(
                name="Malaysia Digital Arrival Card (MDAC)",
                description="All foreign visitors must register at imigresen-online.imi.gov.my within 3 days before arrival. It is free and mandatory.",
                tip="Takes about 5 minutes — fill it in on the plane or at your accommodation.",
                link="https://imigresen-online.imi.gov.my/mdac/main",
            ),
            TravelItem(
                name="Passport Validity",
                description="Your passport must be valid for at least 6 months beyond your intended departure date from Malaysia.",
                tip="Check your expiry date well before you book travel.",
            ),
            TravelItem(
                name="Currency & Payments",
                description="The currency is the Malaysian Ringgit (MYR). Cards are widely accepted in malls and hotels; carry some cash for markets and local eateries.",
                tip="ATMs and currency exchange are available in KK city. Inform your bank before travel to avoid card blocks.",
            ),
            TravelItem(
                name="Connectivity — SIM & eSIM",
                description="Local SIM cards are cheap and widely available at Kota Kinabalu International Airport on arrival. Major providers (Maxis, Celcom, Digi) offer prepaid tourist plans with generous data. If you prefer, grab an eSIM before you fly so you're connected the moment you land.",
                tip="If you'd rather keep your existing number, set up international roaming with your home carrier before you fly.",
            ),
            TravelItem(
                name="Getting Around — Download Grab",
                description="Grab is the go-to ride-hailing app across KK and all of Malaysia. Set it up before you land for easy, cashless travel from the airport and around the city. Grab Food is also great for ordering takeaway delivered straight to your hotel room.",
                tip="Add a card or top up GrabPay in the app before you arrive — it's faster than paying cash per ride and works seamlessly for food delivery too.",
                ios_link="https://apps.apple.com/app/grab-superapp/id647268330",
                android_link="https://play.google.com/store/apps/details?id=com.grabtaxi.passenger",
            ),
        ],
    ),
]
# ────────────────────────────────────────────────────────────────────────────


@router.get("/travel", response_model=TravelResponse)
async def travel(_tier: str = Depends(require_full_tier)):
    return TravelResponse(sections=TRAVEL_CONTENT)
