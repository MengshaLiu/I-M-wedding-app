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
                name="Gaya Street Sunday Market",
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
                name="Visa Requirements",
                description="Many nationalities (AU, NZ, UK, US, EU, most ASEAN) receive 30–90 days visa-free. Check Immigration Malaysia's website for your passport.",
                tip="Not legal advice — always verify with the official source or your embassy.",
            ),
            TravelItem(
                name="Customs Allowance",
                description="Duty-free: 1 litre of alcohol, 200 cigarettes or 225 g tobacco. Strict drug laws apply — declare anything over your allowance.",
                tip="Alcohol availability varies in Sabah — consider stocking up duty-free at the international airport.",
            ),
            TravelItem(
                name="Currency",
                description="Malaysian Ringgit (MYR). Cards are widely accepted in KK city; smaller eateries and markets are cash-only.",
                tip="ATMs are plentiful in KK. Inform your bank before travel to avoid card blocks.",
            ),
        ],
    ),
]
# ────────────────────────────────────────────────────────────────────────────


@router.get("/travel", response_model=TravelResponse)
async def travel(_tier: str = Depends(require_full_tier)):
    return TravelResponse(sections=TRAVEL_CONTENT)
