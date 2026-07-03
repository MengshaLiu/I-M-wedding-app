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
                name="Kota Kinabalu City Mosque",
                description="One of Malaysia's most beautiful mosques, set beside a lagoon. The golden domes glow magnificently at sunset.",
                tip="Visit at dusk for golden reflections on the water.",
            ),
            TravelItem(
                name="Signal Hill Observatory",
                description="A short drive up the hill delivers panoramic views over Kota Kinabalu city and the South China Sea.",
                tip="Best in the early morning before the haze builds.",
            ),
            TravelItem(
                name="Kinabalu Park",
                description="UNESCO World Heritage Site and home to Mt Kinabalu (4,095 m), Southeast Asia's highest peak.",
                tip="Book a guided summit trek well in advance — permits fill months ahead.",
            ),
            TravelItem(
                name="Tunku Abdul Rahman Marine Park",
                description="Five pristine islands a 15-minute ferry ride from the city waterfront — white sand, clear water, great snorkelling.",
                tip="Take the 8 AM ferry for the calmest seas and the best coral visibility.",
            ),
            TravelItem(
                name="Gaya Street Market",
                description="A lively Sunday morning bazaar with local produce, handicrafts, and Sabah street food stretching the length of the street.",
                tip="Go early — it winds down by 1 PM.",
            ),
        ],
    ),
    TravelSection(
        title="Places to Eat",
        items=[
            TravelItem(
                name="KK Waterfront Filipino Market",
                description="Lively open-air night market right on the water — point-and-pick fresh seafood cooked to order at your table.",
                tip="Arrive between 6–8 PM before the best catches sell out.",
            ),
            TravelItem(
                name="Suria Sabah Food Court",
                description="Air-conditioned food court in the Suria Mall — great nasi lemak, laksa, and Sabahan staples.",
                tip="Quiet after 2 PM if you want to avoid the lunch crowd.",
            ),
            TravelItem(
                name="Ya Hua Bah Kut Teh",
                description="Legendary Sabah-style bak kut teh — a must for breakfast if you enjoy herby pork rib soup.",
                tip="Opens at 6 AM and often sells out by 11 AM.",
            ),
            TravelItem(
                name="Welcome Seafood Restaurant",
                description="Long-running favourite for butter prawns, drunken clams, and steamed fish — classic Sabah Chinese seafood.",
                tip="Book ahead on weekends. Noisy and lively; cash preferred.",
            ),
            TravelItem(
                name="Kohinoor Indian Restaurant",
                description="The go-to for excellent naan, biryani, and north Indian curries in KK.",
                tip="Great-value lunch sets; cash preferred.",
            ),
        ],
    ),
    TravelSection(
        title="Entertainment & Activities",
        items=[
            TravelItem(
                name="Island Hopping & Snorkelling",
                description="Hop between the five islands of Tunku Abdul Rahman Marine Park — white sand, coral reefs, and clear turquoise water just a short boat ride from the city.",
                tip="Book a half-day boat from Jesselton Point. Manukan and Sapi are the easiest for a first visit.",
            ),
            TravelItem(
                name="Sunset at Tanjung Aru",
                description="The west-facing beach at Tanjung Aru serves up some of the most celebrated sunsets in all of Malaysia. Our venue sits right on this stretch.",
                tip="Come early for a beach walk before the sky turns — it peaks fast.",
            ),
            TravelItem(
                name="Mari Mari Cultural Village",
                description="A living open-air museum where guides from Sabah's indigenous communities demonstrate traditional food, music, dance, and blowpipe skills.",
                tip="The afternoon session ends with a lively cultural show — worth timing your visit around it.",
            ),
            TravelItem(
                name="Bongawan River Cruise — Proboscis Monkey & Fireflies Mangrove",
                description="A full-day cruise through Bongawan's mangrove wetlands, about 1.5 hours from KK. Spot proboscis monkeys feeding at the riverbanks in the afternoon, catch the Sky Mirror sunset at Bongawan Beach, then drift back through the mangroves as fireflies light up the trees like strings of fairy lights.",
                tip="Book early — spots fill fast and the experience runs rain or shine. Afternoon tea and dinner are usually included in package tours.",
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
                tip="An eSIM from Airalo or Holafly is the easiest option — activate it on the plane and skip the queue at the airport. Or set up international roaming with your home carrier before you fly if you'd rather keep your existing number.",
            ),
            TravelItem(
                name="Getting Around — Download Grab",
                description="Grab is the go-to ride-hailing app across KK and all of Malaysia. Set it up before you land for easy, cashless travel from the airport and around the city. Grab Food is also great for ordering takeaway delivered straight to your hotel room.",
                tip="Add a card or top up GrabPay in the app before you arrive — it's faster than paying cash per ride and works seamlessly for food delivery too.",
            ),
        ],
    ),
]
# ────────────────────────────────────────────────────────────────────────────


@router.get("/travel", response_model=TravelResponse)
async def travel(_tier: str = Depends(require_full_tier)):
    return TravelResponse(sections=TRAVEL_CONTENT)
