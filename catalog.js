const PRODUCTS = [
  {
    id: "hp-aurora-anc",
    name: "Aurora ANC Over-Ear Headphones",
    category: "headphones",
    price: 129.0,
    description:
      "Wireless over-ear headphones with hybrid noise cancelling, 32-hour battery, and a folding travel case.",
  },
  {
    id: "hp-city-buds",
    name: "City Buds Mini",
    category: "headphones",
    price: 49.0,
    description:
      "Compact true wireless earbuds with IPX4 splash resistance and a charging case that lasts a work week.",
  },
  {
    id: "kb-folio-low",
    name: "Folio Low-Profile Keyboard",
    category: "keyboards",
    price: 89.0,
    description:
      "Quiet low-profile mechanical keyboard with hot-swap switches, USB-C, and a compact 75% layout.",
  },
  {
    id: "kb-typewell-split",
    name: "Typewell Split Keyboard",
    category: "keyboards",
    price: 159.0,
    description:
      "Ergonomic split keyboard with tenting legs, programmable layers, and a detachable numbered keypad.",
  },
  {
    id: "cf-brew-pour",
    name: "Harbor Pour-Over Kettle",
    category: "coffee gear",
    price: 42.0,
    description:
      "Gooseneck kettle with a temperature display, 1.0 L capacity, and a balanced pour for drip coffee.",
  },
  {
    id: "cf-mill-burr",
    name: "Millhouse Burr Grinder",
    category: "coffee gear",
    price: 95.0,
    description:
      "Electric conical burr grinder with 30 grind settings, a timed dose, and a compact footprint.",
  },
  {
    id: "dk-monitor-arm",
    name: "Northline Single Monitor Arm",
    category: "desk accessories",
    price: 64.0,
    description:
      "Gas-spring monitor arm for 17–32 inch screens, cable routing, and a clamp or grommet mount.",
  },
  {
    id: "sp-shelf-duo",
    name: "Shelf Duo Bluetooth Speakers",
    category: "speakers",
    price: 119.0,
    description:
      "Pair of compact bookshelf speakers with Bluetooth 5.3, a 3.5 mm input, and a wood-grain finish.",
  },
];

function searchProducts(query, maxPrice) {
  const needle = String(query || "").trim().toLowerCase();
  return PRODUCTS.filter((product) => {
    const haystack = `${product.id} ${product.name} ${product.category} ${product.description}`.toLowerCase();
    const matchesQuery = !needle || haystack.includes(needle);
    const matchesPrice =
      typeof maxPrice !== "number" || Number.isNaN(maxPrice) || product.price <= maxPrice;
    return matchesQuery && matchesPrice;
  });
}

function findProduct(term) {
  const needle = String(term || "").trim().toLowerCase();
  if (!needle) {
    return undefined;
  }

  return (
    PRODUCTS.find((product) => product.id.toLowerCase() === needle) ||
    PRODUCTS.find((product) => product.name.toLowerCase() === needle) ||
    PRODUCTS.find((product) => product.name.toLowerCase().includes(needle)) ||
    PRODUCTS.find((product) => product.id.toLowerCase().includes(needle))
  );
}

module.exports = {
  PRODUCTS,
  searchProducts,
  findProduct,
};
