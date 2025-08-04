"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import logo from "@/public/logo-removebg-preview.png"; // Adjust the path as necessary
import { motion } from "framer-motion";
import {
  Download,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Inter, Poppins } from "next/font/google";

// Font Configuration
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // Added 700 for bold text
  variable: "--font-inter",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"], // 400 for regular, 600 for semi-bold, 700 for bold
  variable: "--font-poppins",
});

// Define your image and name data
const imageData = [
  {
    src: "/imagedataset/cam.png",
    name: "Class Activation Mapping (CAM)",
    url: "/can-ml/cam",
  },
  {
    src: "/imagedataset/2.png",
    name: "Gradient-weighted Class Activation Mapping (Grad-CAM)",
    url: "/can-ml/gradcam",
  },
  {
    src: "/imagedataset/3.png",
    name: "Integrated Gradients",
    url: "/can-ml/ig",
  },
  {
    src: "/imagedataset/3.1.png",
    name: "SHAP (SHapley Additive exPlanations)",
    url: "/can-ml/shap",
  },
  {
    src: "/imagedataset/4.jpg",
    name: "Trainable Attention",
    url: "/can-ml/attention",
  },
  {
    src: "/imagedataset/5.png",
    name: "Layer-wise Relevance Propagation (LRP)",
    url: "/can-ml/lrp",
  },
  {
    src: "/imagedataset/6.png",
    name: "Guided Backpropagation",
    url: "/can-ml/guidedbp",
  },
  {
    src: "/imagedataset/7.png",
    name: "Attention Map",
    url: "/can-ml/trainableattn",
  },
  {
    src: "/imagedataset/8.png",
    name: "Saliency Map",
    url: "/can-ml/saliency",
  },
  {
    src: "/imagedataset/9.png",
    name: "Occlusion & Sensitivity Analysis",
    url: "/can-ml/occlusion",
  },
];

// Button Component
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 ${inter.className} ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Card Components
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white shadow-lg rounded-xl overflow-hidden transition-transform duration-300 hover:shadow-xl ${className}`}
  >
    {children}
  </div>
);
const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${inter.className} ${className}`}>{children}</div>
);

export default function Component() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Scroll function for image carousel
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      if (direction === "left") {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0b354c] to-[#1a4a6b] text-white px-4 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span
                className={`text-white font-bold text-lg ${poppins.className}`}
              >
                B
              </span>
            </div>
            <span className={`text-2xl font-bold ${poppins.className}`}>
              Thanusanth
            </span>
          </div>
          <nav className="hidden md:flex space-x-6">
            {[
              { name: "Home", href: "/" },
              { name: "Medical Expert Evaluation", href: "/login" },
              { name: "Datasets", href: "/datasets" },
              { name: "Researches", href: "#" },

              { name: "News", href: "#" },
              { name: "Contact", href: "#" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-200 hover:text-white transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                document.cookie =
                  "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                window.location.href = "/loginmain";
              }}
              className="text-gray-200 hover:text-white transition-colors duration-200"
            >
              Logout
            </button>
          </nav>
          <button
            className="md:hidden p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.nav
            className="md:hidden mt-4 bg-[#0b354c]/95 rounded-lg p-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col space-y-4">
              {[
                { name: "Home", href: "/" },
                { name: "Medical Expert Evaluation", href: "/login" },
                { name: "Datasets", href: "/datasets" },
                { name: "Researches", href: "#" },

                { name: "News", href: "#" },
                { name: "Contact", href: "#" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="block text-gray-200 hover:text-white transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    document.cookie =
                      "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    window.location.href = "/loginmain";
                  }}
                  className="block text-gray-200 hover:text-white transition-colors duration-200"
                >
                  Logout
                </button>
              </li>
            </ul>
          </motion.nav>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-96 md:h-[300px] overflow-hidden bg-gradient-to-b from-slate-900 to-gray-800">
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900" />
          </motion.div>
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-10 bg-gradient-radial from-blue-600/40 via-transparent to-transparent" />
          </motion.div>
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          >
            <div className="w-full h-full bg-[url('/bgforexplainableai.jpg')] bg-cover bg-center mix-blend-overlay opacity-50" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center justify-left h-full pl-20">
          <motion.h1
            className={`${poppins.className} text-4xl sm:text-5xl md:text-6xl font-semibold text-white tracking-wide text-center`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Explainable AI
          </motion.h1>
        </div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-300/50 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.7, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Intro Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mr-3 flex items-center justify-center">
              <span
                className={`text-white font-bold text-xl ${poppins.className}`}
              >
                B
              </span>
            </div>
            <span
              className={`text-2xl sm:text-3xl font-bold text-gray-900 ${poppins.className}`}
            >
              Thanusanth
            </span>
          </div>
          <h2
            className={`text-xl sm:text-2xl font-semibold text-gray-900 mb-4 max-w-3xl mx-auto ${poppins.className}`}
          >
            Explainable AI will build trust and confidence by making model
            decisions transparent, while also detecting biases and errors early
            to keep AI systems fair, safe, and compliant.
          </h2>
        </div>

        {/* Dataset Description */}
        <section className="mb-12 sm:mb-16">
          <h3
            className={`text-lg sm:text-xl font-semibold mb-4 text-gray-900 ${poppins.className}`}
          >
            UltraSound
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
            Clinicians can simply drag and drop scans to get instant,
            side-by-side visual explanations that reveal exactly what the AI
            “sees.” No coding required—our seamless, cloud-based tool brings
            transparency and trust directly into clinical workflows.
          </p>
        </section>

        <section className="mb-12 sm:mb-16 relative">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md"
            aria-label="Scroll left"
            type="button"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto space-x-6 px-10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
          >
            {imageData.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-96"
              >
                <Card>
                  <CardContent>
                    <div className="aspect-[16/7] bg-gray-900 rounded-lg overflow-hidden relative">
                      <Image
                        src={item.src}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      {item.name}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md"
            aria-label="Scroll right"
            type="button"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <p className="text-sm text-gray-600 mt-4 text-center">
            Figure 1: Example with BI-RADS 5 and BI-RADS 1 in opposing breasts.
          </p>
        </section>

        {/* Ultra sound explainablity */}
        <section className="mb-12 sm:mb-16">
          <h3
            className={`text-lg sm:text-xl font-semibold mb-4 text-gray-900 ${poppins.className}`}
          >
            Mammography
          </h3>
          <section className="mb-12 sm:mb-16 relative">
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md"
              aria-label="Scroll left"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div
              ref={scrollRef}
              className="flex overflow-x-auto space-x-6 px-10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
            >
              {imageData.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-96"
                >
                  <Card>
                    <CardContent>
                      <div className="aspect-[16/7] bg-gray-900 rounded-lg overflow-hidden relative">
                        <Image
                          src={item.src}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-3 text-center">
                        {item.name}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md"
              aria-label="Scroll right"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            <p className="text-sm text-gray-600 mt-4 text-center">
              Figure 2: Example with BI-RADS 5 and BI-RADS 1 in opposing
              breasts.
            </p>
          </section>
        </section>

        {/* Enhance explainablity */}
        <section className="mb-12 sm:mb-16">
          <h3
            className={`text-lg sm:text-xl font-semibold mb-4 text-gray-900 ${poppins.className}`}
          >
            Enhance explainablity
          </h3>
          <section className="mb-12 sm:mb-16 relative">
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md"
              aria-label="Scroll left"
              type="button"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div
              ref={scrollRef}
              className="flex overflow-x-auto space-x-6 px-10 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
            >
              {imageData.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-96"
                >
                  <Card>
                    <CardContent>
                      <div className="aspect-[16/7] bg-gray-900 rounded-lg overflow-hidden relative">
                        <Image
                          src={item.src}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-3 text-center">
                        {item.name}
                      </p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-md"
              aria-label="Scroll right"
              type="button"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            <p className="text-sm text-gray-600 mt-4 text-center">
              Figure 2: Example with BI-RADS 5 and BI-RADS 1 in opposing
              breasts.
            </p>
          </section>
        </section>

        {/* Data Table */}
        <section className="mb-12 sm:mb-16">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm sm:text-base">
              <thead className="bg-gray-100">
                <tr>
                  {["Split", "Training", "Test", "Total"].map((col) => (
                    <th
                      key={col}
                      className={`border border-gray-300 px-4 py-2 text-left font-medium ${poppins.className}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Exams</td>
                  <td className="border border-gray-300 px-4 py-2">4,000</td>
                  <td className="border border-gray-300 px-4 py-2">1,000</td>
                  <td className="border border-gray-300 px-4 py-2">5,000</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Images</td>
                  <td className="border border-gray-300 px-4 py-2">16,000</td>
                  <td className="border border-gray-300 px-4 py-2">4,000</td>
                  <td className="border border-gray-300 px-4 py-2">20,000</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm text-gray-600 mt-4">
              Table 1: Statistics of exams and images for each split.
            </p>
          </div>
        </section>

        {/* Download */}
        <section className="mb-12 sm:mb-16 text-center">
          <h3
            className={`text-lg sm:text-xl font-semibold mb-4 text-gray-900 ${poppins.className}`}
          >
            Download
          </h3>
          <p className="text-gray-700 mb-6 text-sm sm:text-base">
            The Explainable AI Output
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
        </section>

        {/* Citation */}
        <section className="mb-12 sm:mb-16">
          <h3
            className={`text-lg sm:text-xl font-semibold mb-4 text-gray-900 ${poppins.className}`}
          >
            Citation
          </h3>
          <div className="bg-gray-100 p-4 sm:p-6 rounded-lg">
            <code
              className={`text-sm text-gray-700 whitespace-pre-wrap ${inter.className}`}
            >
              {`@article{nguyen2022Thanusanth,
  title={Thanusanth-Mammo: A large-scale benchmark dataset for computer-aided diagnosis in full-field digital Explainable AI},
  author={Nguyen, Hieu T and others},
  journal={Scientific Data},
  year={2022},
  publisher={Nature Publishing Group}
}`}
            </code>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-gray-800 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span
                  className={`text-white font-bold text-lg ${poppins.className}`}
                >
                  V
                </span>
              </div>
              <span className={`text-xl font-semibold ${poppins.className}`}>
                Thanusanth
              </span>
            </div>
            <div className="flex space-x-4">
              {["f", "t", "in"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors duration-200"
                  aria-label={`Social media link ${icon}`}
                >
                  <span className="text-sm font-medium">{icon}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className={`text-lg font-semibold mb-4 ${poppins.className}`}>
              Quick Links
            </h4>
            <ul className="space-y-3 text-gray-300 text-sm sm:text-base">
              {[
                "About",
                "Thanusanth-RibCX",
                "Thanusanth-CXR",
                "Thanusanth-Lab",
                "Publications",
                "Team",
                "Careers",
                "News",
                "Contact",
              ].map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={`text-lg font-semibold mb-4 ${poppins.className}`}>
              Contacts
            </h4>
            <div className="space-y-4 text-gray-300 text-sm sm:text-base">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>
                  Building A1, VinUniversity, Vinhomes Ocean Park, Gia Lam, Ha
                  Noi, Viet Nam
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a
                  href="mailto:Thanusanth.contact@vinbigdata.org"
                  className="hover:text-white"
                >
                  Thanusanth.contact@vinbigdata.org
                </a>
              </div>
            </div>
          </div>
          <div>
            <h4 className={`text-lg font-semibold mb-4 ${poppins.className}`}>
              Newsletter
            </h4>
            <div className="flex flex-col space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className={`px-4 py-2 rounded-lg bg-gray-700 text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${inter.className}`}
                aria-label="Email for newsletter"
                suppressHydrationWarning={true}
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
          <p>© 2025 VinBigData. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
