import asyncio
import random
from prisma import Prisma
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://zznakrbijfaxzfoatdzs.supabase.co/storage/v1/object/public/product-images/"


def detailed(name, category, color):
    if "Summer" in category and "Clothes" != "Shoes":
        return f"The {name} is an essential addition to your summer wardrobe. Engineered for breathability in Pakistan's intense heat, this {color.lower()} piece uses premium lightweight fibers for maximum airflow. The urban silhouette keeps you sharp whether you're at a casual meetup or an evening out. Designed to resist humidity while maintaining a crisp, tailored look. Perfect for Lahore, Karachi, and Islamabad summers."
    elif "Winter" in category and "Shoes" not in name:
        return f"Experience ultimate warmth with the {name}. Built for the modern Pakistani winter, this {color.lower()} garment features advanced insulation without unnecessary bulk. The premium construction and reinforced stitching make it durable enough for Murree winters while transitioning perfectly into formal Islamabad settings. A must-have for the cold season."
    elif "Shoes" in category or "Shoes" in name:
        return f"Step into premium comfort with the {name}. Crafted with high-traction soles and cushioned midsoles for all-day wear. The {color.lower()} premium materials provide a secure fit while allowing natural movement. Perfect for navigating Pakistan's city streets, blending athletic performance with fashion-forward aesthetics."
    return f"The {name} represents HDwear's core values: quality, durability, and style. Every detail has been meticulously designed for the modern Pakistani wardrobe."


async def seed_products():
    db = Prisma()
    print("🔌 Connecting to Supabase...")
    await db.connect()

    print("🗑️  Clearing old inventory...")
    await db.product.delete_many()

    products = [
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # SUMMER MEN CLOTHES (14)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Midnight Urban Tee", "price": 2500, "min_price": 1800,
         "description": "Classic black slim-fit tee for everyday style.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Black", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/BlackShirt.webp"},

        {"name": "Vertical Stripe Resort Shirt", "price": 3200, "min_price": 2400,
         "description": "Breathable black and white striped summer shirt.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Black", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/BlackWhiteStriped.png"},

        {"name": "Forest Stripe Casual Shirt", "price": 3000, "min_price": 2200,
         "description": "Fresh green and white striped casual shirt.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Green", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/GreenWHiteStripes.png"},

        {"name": "Sky Blue Comfort Tee", "price": 2200, "min_price": 1600,
         "description": "Soft light blue t-shirt for a cool summer look.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Blue", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/LightBlueTshirt.webp"},

        {"name": "Multi-Stripe Weekend Shirt", "price": 3500, "min_price": 2600,
         "description": "Vibrant multi-colored striped shirt for casual outings.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Multi", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/MultiStriped.png"},

        {"name": "Azure Casual Button-Down", "price": 3800, "min_price": 2800,
         "description": "Lightweight plain blue button-down shirt.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Blue", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/PlainBlue.png"},

        {"name": "Beige Linen Button-Down", "price": 3500, "min_price": 2500,
         "description": "Premium skin-tone linen shirt with buttons.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Beige", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/SKinButtonedShirt.png"},

        {"name": "Khaki Urban Shorts", "price": 2800, "min_price": 2000,
         "description": "Comfortable khaki shorts for hot summer days.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Beige", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/SkinShorts.png"},

        {"name": "Executive White Dress Shirt", "price": 4000, "min_price": 3000,
         "description": "Crisp white formal dress shirt for summer events.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "White", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/WhiteDressShirt.png"},

        {"name": "Camel Casual Tee", "price": 2200, "min_price": 1600,
         "description": "Relaxed light brown t-shirt with a soft finish.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Brown", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/lightBrownTShirt.webp"},

        {"name": "Silver Mist Polo", "price": 2800, "min_price": 2000,
         "description": "Light grey polo shirt with premium pique fabric.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Grey", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/lightGreyShirt.jpg"},

        {"name": "Abstract Print Resort Shirt", "price": 3200, "min_price": 2400,
         "description": "Bold printed shirt perfect for beach or resort wear.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "Multi", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/printedShirt.png"},

        {"name": "Classic White Polo", "price": 2500, "min_price": 1800,
         "description": "Timeless white polo for a clean, sporty look.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "White", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/whitePolo.webp"},

        {"name": "Essential White Tee", "price": 1800, "min_price": 1200,
         "description": "Your everyday essential plain white t-shirt.",
         "category": "Men Summer", "sub_category": "Clothes", "color": "White", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/clothes/whiteTshirt.jpg"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # SUMMER MEN SHOES (6)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Earth-Tone Urban Sneakers", "price": 7500, "min_price": 5500,
         "description": "Brown leather sneakers with breathable mesh panels.",
         "category": "Men Summer", "sub_category": "Shoes", "color": "Brown", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/shoes/BrownSneakers.jpg"},

        {"name": "Olive Minimal Loafers", "price": 6500, "min_price": 4800,
         "description": "Suede olive green loafers for effortless style.",
         "category": "Men Summer", "sub_category": "Shoes", "color": "Green", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/shoes/OliveGreenLoafers.avif"},

        {"name": "Breeze Summer Slides", "price": 2500, "min_price": 1800,
         "description": "Lightweight slider sandals for casual summer days.",
         "category": "Men Summer", "sub_category": "Shoes", "color": "Black", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/shoes/SummerSliders.png"},

        {"name": "Tan Casual Sneakers", "price": 6800, "min_price": 5000,
         "description": "Light brown everyday sneakers with comfort sole.",
         "category": "Men Summer", "sub_category": "Shoes", "color": "Brown", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/shoes/lightBrownSneakers.jpg"},

        {"name": "Burgundy Sport Sneakers", "price": 8500, "min_price": 6500,
         "description": "Premium maroon athletic sneakers for street style.",
         "category": "Men Summer", "sub_category": "Shoes", "color": "Maroon", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/shoes/maroonSneakers.jpg"},

        {"name": "Heritage Peshawari Chappal", "price": 4500, "min_price": 3200,
         "description": "Handcrafted traditional Peshawari leather chappal.",
         "category": "Men Summer", "sub_category": "Shoes", "color": "Brown", "gender": "Men", "season": "Summer",
         "image_url": f"{BASE_URL}summer/men/shoes/peshawri%20chappal.webp"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # SUMMER WOMEN CLOTHES (7)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Monochrome Cord Set", "price": 5500, "min_price": 4000,
         "description": "Chic black and white matching coord set.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "Black", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/BlackWhiteCord.jpg"},

        {"name": "Emerald Cord Set", "price": 5800, "min_price": 4200,
         "description": "Matching forest green coord set with black accents.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "Green", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/Blackgreencord.jpg"},

        {"name": "Rainbow Festival Cord Set", "price": 6200, "min_price": 4500,
         "description": "Vibrant multi-colored coord set for festivals.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "Multi", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/MultiCordset.jpg"},

        {"name": "Crimson Summer Set", "price": 5500, "min_price": 4000,
         "description": "Vibrant red coord set for bold summer statements.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "Red", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/RedCordSet.jpg"},

        {"name": "Ivory Ruffle Blouse", "price": 3800, "min_price": 2800,
         "description": "Elegant white ruffle blouse for summer events.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "White", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/WhiteRuffleShirt.jpg"},

        {"name": "Mint Floral Day Dress", "price": 6500, "min_price": 4800,
         "description": "Flowy mint green chiffon dress for sunny days.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "Green", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/mintColorDress.jpg"},

        {"name": "Lavender Cord Set", "price": 5800, "min_price": 4200,
         "description": "Soft purple matching coord set with modern cut.",
         "category": "Women Summer", "sub_category": "Clothes", "color": "Purple", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenClothes/purplecord.jpg"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # SUMMER WOMEN SHOES (8)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Blush Sandal Slides", "price": 3500, "min_price": 2500,
         "description": "Comfortable pink flat sandal slides.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Pink", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/PinkSandal.jpg"},

        {"name": "Silver Glam Heels", "price": 6500, "min_price": 4800,
         "description": "Stunning silver high heels for parties.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Silver", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/SilverHeels.jpg"},

        {"name": "Classic Black Ballet Flats", "price": 4200, "min_price": 3000,
         "description": "Timeless black ballet flat shoes.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Black", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/balckBallets.jpg"},

        {"name": "Midnight Stiletto Heels", "price": 7000, "min_price": 5200,
         "description": "Elegant black stiletto heels for formal events.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Black", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/black%20heels.avif"},

        {"name": "Crystal Embellished Slides", "price": 4800, "min_price": 3500,
         "description": "Fancy embellished slides with crystal details.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Gold", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/fancySlides.jpg"},

        {"name": "Olive Comfort Sandals", "price": 3800, "min_price": 2800,
         "description": "Cushioned olive green casual sandals.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Green", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/oliverComfy.jpg"},

        {"name": "Nude Comfort Sliders", "price": 2800, "min_price": 2000,
         "description": "Minimalist skin-tone slider sandals.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "Beige", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/skinSliders.webp"},

        {"name": "Pearl White Heels", "price": 6800, "min_price": 5000,
         "description": "Elegant pearl white heels for weddings and events.",
         "category": "Women Summer", "sub_category": "Shoes", "color": "White", "gender": "Women", "season": "Summer",
         "image_url": f"{BASE_URL}summer/women/womenShoes/whiteheels.jpg"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # WINTER MEN CLOTHES (10)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Urban Stealth Bomber", "price": 8500, "min_price": 6500,
         "description": "Sleek black bomber jacket for urban style.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Black", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/BlackJacket.png"},

        {"name": "Midnight Leather Biker", "price": 18000, "min_price": 14000,
         "description": "Premium black leather biker jacket.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Black", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/BlackLeather.png"},

        {"name": "Classic Denim Trucker", "price": 7500, "min_price": 5500,
         "description": "Light wash blue denim trucker jacket.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Blue", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/Blue%20denim.jpg"},

        {"name": "Nordic Blue Overcoat", "price": 12000, "min_price": 9500,
         "description": "Formal blue wool-blend overcoat for sharp looks.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Blue", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/BlueCaot.png"},

        {"name": "Arctic Command Puffer", "price": 10500, "min_price": 8000,
         "description": "Heavy-duty blue insulated puffer jacket.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Blue", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/BluePuffer.png"},

        {"name": "Sherpa-Lined Denim", "price": 8000, "min_price": 6000,
         "description": "Warm denim jacket with faux-fur sherpa lining.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Blue", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/FurrDenim.png"},

        {"name": "Olive Trekker Puffer", "price": 10000, "min_price": 7800,
         "description": "Vibrant green puffer jacket for outdoor adventures.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Green", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/Green%20puffer.png"},

        {"name": "Executive Grey Overcoat", "price": 14000, "min_price": 11000,
         "description": "Sophisticated grey wool overcoat for formal settings.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Grey", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/GreyCoat.png"},

        {"name": "Tan Heritage Leather Jacket", "price": 16000, "min_price": 12500,
         "description": "Rugged brown leather jacket with vintage appeal.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Brown", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/brown%20leather.png"},

        {"name": "Emergency Red Puffer", "price": 9500, "min_price": 7200,
         "description": "Bold red puffer jacket for maximum warmth.",
         "category": "Men Winter", "sub_category": "Clothes", "color": "Red", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menClothes/refPuffer.png"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # WINTER MEN SHOES (5)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Cobalt Winter Boots", "price": 8500, "min_price": 6500,
         "description": "Sturdy blue boots built for cold weather.",
         "category": "Men Winter", "sub_category": "Shoes", "color": "Blue", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menShoes/Blue%20shoes.png"},

        {"name": "Slate Grey Boots", "price": 7800, "min_price": 5800,
         "description": "Versatile grey boots for daily winter wear.",
         "category": "Men Winter", "sub_category": "Shoes", "color": "Grey", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menShoes/Gey%20shoes.png"},

        {"name": "Forest Trail Boots", "price": 7500, "min_price": 5500,
         "description": "Green outdoor boots for trekking and hiking.",
         "category": "Men Winter", "sub_category": "Shoes", "color": "Green", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menShoes/Green%20shoes.png"},

        {"name": "Rugged Fur-Lined Boots", "price": 9500, "min_price": 7200,
         "description": "Brown leather boots with warm fur lining.",
         "category": "Men Winter", "sub_category": "Shoes", "color": "Brown", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menShoes/brown%20fur%20boat.png"},

        {"name": "Heritage Tall Boots", "price": 10500, "min_price": 8000,
         "description": "Classic tall brown leather boots.",
         "category": "Men Winter", "sub_category": "Shoes", "color": "Brown", "gender": "Men", "season": "Winter",
         "image_url": f"{BASE_URL}winter/men/menShoes/brown%20long%20boats.png"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # WINTER WOMEN CLOTHES (10)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Boho Cape Shawl", "price": 7500, "min_price": 5500,
         "description": "Warm patterned bohemian cape shawl.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Beige", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/Capeshawl.png"},

        {"name": "Emerald Faux-Fur Wrap", "price": 14000, "min_price": 11000,
         "description": "Luxurious green faux-fur statement coat.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Green", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/GreenFaux.png"},

        {"name": "Forest Green Trench", "price": 12500, "min_price": 9800,
         "description": "Vibrant green trench coat with belt detail.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Green", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/GreenTrench.png"},

        {"name": "Executive Cape Coat", "price": 13500, "min_price": 10500,
         "description": "Sophisticated grey cape coat for formal occasions.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Grey", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/GreyCapeCoat.png"},

        {"name": "Monochrome Minimalist Set", "price": 8500, "min_price": 6500,
         "description": "Sleek grey winter coord set with clean lines.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Grey", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/GreyMonochormatid'.png"},

        {"name": "Arctic Tracksuit", "price": 9500, "min_price": 7200,
         "description": "Heavyweight thermal tracksuit for active winters.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Grey", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/Tracksuit.png"},

        {"name": "Cream Urban Sweater", "price": 5500, "min_price": 4000,
         "description": "Premium cream knit sweater for cozy days.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "White", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/WhiteSweater.png"},

        {"name": "Midnight Azure Puffer", "price": 10500, "min_price": 8000,
         "description": "Insulated blue puffer jacket for extreme cold.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Blue", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/bluePuffer.png"},

        {"name": "Camel Heritage Trench", "price": 13000, "min_price": 10000,
         "description": "Classic brown trench coat with timeless design.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Brown", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/brownTrenchcoat.png"},

        {"name": "Winter Printed Skirt", "price": 4500, "min_price": 3200,
         "description": "Thick fabric printed skirt for winter styling.",
         "category": "Women Winter", "sub_category": "Clothes", "color": "Multi", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenClothes/printedSkirt.png"},

        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # WINTER WOMEN SHOES (6)
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        {"name": "Obsidian Ankle Boots", "price": 6500, "min_price": 4800,
         "description": "Sleek black ankle boots for winter chic.",
         "category": "Women Winter", "sub_category": "Shoes", "color": "Black", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenShoes/BlackShoes.png"},

        {"name": "Sapphire Ankle Boots", "price": 7200, "min_price": 5500,
         "description": "Stylish blue ankle boots with zip detail.",
         "category": "Women Winter", "sub_category": "Shoes", "color": "Blue", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenShoes/Blueboots.png"},

        {"name": "Chestnut Chelsea Boots", "price": 7500, "min_price": 5800,
         "description": "Classic brown chelsea boots for everyday wear.",
         "category": "Women Winter", "sub_category": "Shoes", "color": "Brown", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenShoes/BrownShoes.png"},

        {"name": "Emerald Statement Boots", "price": 8000, "min_price": 6000,
         "description": "Bold green boots to make a winter statement.",
         "category": "Women Winter", "sub_category": "Shoes", "color": "Green", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenShoes/GreenBoots.png"},

        {"name": "Burgundy Classic Boots", "price": 6800, "min_price": 5000,
         "description": "Rich maroon boots with classic silhouette.",
         "category": "Women Winter", "sub_category": "Shoes", "color": "Maroon", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenShoes/MaroonBoots.png"},

        {"name": "Arctic Frost Fur Boots", "price": 8500, "min_price": 6500,
         "description": "White boots with luxurious fur trim detail.",
         "category": "Women Winter", "sub_category": "Shoes", "color": "White", "gender": "Women", "season": "Winter",
         "image_url": f"{BASE_URL}winter/women/womenShoes/whiteFurrShoes.png"},
    ]

    print(f"📦 Seeding {len(products)} products to Supabase...")
    for p in products:
        p['detailed_description'] = detailed(
            p['name'], p['category'], p['color'])
        p['stock'] = random.randint(3, 20)
        p['rating'] = round(random.uniform(4.2, 5.0), 1)
        p['reviews_count'] = random.randint(8, 250)

        await db.product.create(data=p)
        print(
            f"  ✅ {p['name']} | Rs {p['price']} | {p['color']} | {p['category']}")

    count = await db.product.count()
    print(f"\n🎉 DONE! {count} products live in database.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(seed_products())
