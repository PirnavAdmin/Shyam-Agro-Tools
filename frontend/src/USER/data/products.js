import tractorImg from '../IMAGES/tractor.png';
import cultivatorImg from '../IMAGES/cultivator.png';
import tillerImg from '../IMAGES/tiller.png';
import irrigationImg from '../IMAGES/irrigation.png';
import cutterImg from '../IMAGES/cutter.jpg';
import drillerImg from '../IMAGES/driller.jpg';
import wrenchImg from '../IMAGES/rench.jpg';

export const products = [
  // Heavy Machinery
  {
    id: "tractor-01",
    name: "MODERN TRACTOR",
    displayName: "Professional Heavy-Duty Industrial Tractor",
    image: tractorImg,
    price: 450000,
    mrp: 580000,
    discount: "22% OFF",
    rating: 4.9,
    sku: "AG-TRAC-X1",
    shortDesc: "Industrial-grade tractor designed for large scale farming and heavy-duty tasks.",
    longDesc: "This professional tractor is built for endurance and high performance. Ideal for large-scale agriculture, it ensures maximum torque and efficiency.",
    category: "Heavy Machinery",
    inStock: true
  },
  {
    id: "cultivator-01",
    name: "CULTIVATOR",
    displayName: "Premium Soil Cultivator & Plow",
    image: cultivatorImg,
    price: 15500,
    mrp: 22000,
    discount: "29% OFF",
    rating: 4.8,
    sku: "AG-CULT-P2",
    shortDesc: "High-precision cultivator for soil aeration and preparation.",
    longDesc: "Engineered for deep soil penetration, this cultivator features hardened steel blades and adjustable depth control.",
    category: "Agriculture Tools",
    inStock: true
  },
  {
    id: "tiller-01",
    name: "POWER TILLER",
    displayName: "Industrial Strength Rotary Power Tiller",
    image: tillerImg,
    price: 85000,
    mrp: 110000,
    discount: "23% OFF",
    rating: 4.9,
    sku: "AG-TILL-T4",
    shortDesc: "Powerful rotary tiller for efficient land preparation and weeding.",
    longDesc: "Versatile and powerful, this power tiller is perfect for various soil types and agricultural applications.",
    category: "Heavy Machinery",
    inStock: true
  },
  {
    id: "irrigation-01",
    name: "IRRIGATION SYSTEM",
    displayName: "Advanced Agricultural Irrigation Unit",
    image: irrigationImg,
    price: 12500,
    mrp: 18000,
    discount: "30% OFF",
    rating: 4.7,
    sku: "AG-IRRI-S5",
    shortDesc: "Modern irrigation system with high-pressure sprinklers and distribution pipes.",
    longDesc: "Ensure optimal water distribution with our state-of-the-art irrigation units designed for efficiency and durability.",
    category: "Irrigation & Water",
    inStock: true
  },

  // Workshop & Maintenance
  {
    id: "cutter-01",
    name: "PRECISION CUTTER",
    displayName: "Industrial Grade Handheld Material Cutter",
    image: cutterImg,
    price: 2450,
    mrp: 3500,
    discount: "30% OFF",
    rating: 4.7,
    sku: "AG-CUT-901",
    shortDesc: "Ultra-sharp precision cutter for heavy fabrics, plastics, and industrial materials.",
    longDesc: "Engineered for professional use, this handheld cutter provides clean, straight cuts every time.",
    category: "Workshop Tools",
    inStock: true
  },
  {
    id: "wrench-01",
    name: "INDUSTRIAL WRENCH",
    displayName: "Adjustable Heavy-Duty Chrome Wrench",
    image: wrenchImg,
    price: 1100,
    mrp: 1600,
    discount: "31% OFF",
    rating: 4.8,
    sku: "AG-WREN-774",
    shortDesc: "Hardened chrome steel adjustable wrench for industrial maintenance.",
    longDesc: "A must-have for every toolkit. Features laser-etched scales for precise sizing.",
    category: "Workshop Tools",
    inStock: true
  },

  // Power Equipment
  {
    id: "driller-01",
    name: "POWER DRILLER",
    displayName: "High-Torque Professional Impact Driller",
    image: drillerImg,
    price: 4890,
    mrp: 6999,
    discount: "30% OFF",
    rating: 4.8,
    sku: "AG-DRIL-223",
    shortDesc: "High-performance power drill with variable speed control and impact mode.",
    longDesc: "A versatile tool for any construction or agriculture maintenance project.",
    category: "Power Tools",
    inStock: true
  }
];

