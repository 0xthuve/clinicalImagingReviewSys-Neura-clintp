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
  weight: ["400", "600", "700"],
  variable: "--font-inter",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

// Button Component
const Button = ({ children, className = "", ...props }) => (
  <button
    className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:scale-105 ${inter.className} ${className}`}
    {...props}
  >
    {children}
  </button>
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

  // Dataset Data
  const mammographicDatasets = [
    {
      name: "VinDr-Mammo",
      link: "https://physionet.org/content/vindr-mammo/1.0.0/",
      biRads: true,
      images: "20,000",
      patients: "5,000",
      maskImages: true,
      viewCC: true,
      viewMLO: true,
    },
    {
      name: "EMory BrEast Imaging Dataset (EMBED)",
      link: "https://registry.opendata.aws/emory-breast-imaging-dataset-embed/",
      biRads: true,
      images: "1,010,000",
      patients: "-",
      maskImages: false,
      viewCC: false,
      viewMLO: false,
    },
    {
      name: "CBIS DDSM Dataset",
      link: "https://www.kaggle.com/datasets/orvile/cbis-ddsm-dataset/data",
      biRads: true,
      images: "891",
      patients: "-",
      maskImages: true,
      viewCC: true,
      viewMLO: true,
    },
    {
      name: "Digital Database for Screening Mammography (DDSM)",
      link: "https://www.cancerimagingarchive.net/collection/cbis-ddsm/",
      biRads: false,
      images: "2,620",
      patients: "-",
      maskImages: false,
      viewCC: true,
      viewMLO: true,
    },
  ];

  const ultrasoundDatasets = [
    {
      name: "Breast Ultrasound Images Dataset (BUSI)",
      link: "https://www.kaggle.com/datasets/sabahesaraki/breast-ultrasound-images-dataset",
      biRads: false,
      images: "780",
      patients: "600",
      maskImages: true,
      sampleData: true,
    },
    {
      name: "TCIA BREAST-LESIONS-USG Dataset",
      link: "https://www.cancerimagingarchive.net/collection/breast-lesions-usg/",
      biRads: true,
      images: "256",
      patients: "256",
      maskImages: false,
      sampleData: true,
    },
    {
      name: "BUS-UCLM: Breast Ultrasound Dataset",
      link: "https://github.com/ellisdg/BUS-UCLM",
      biRads: false,
      images: "683",
      patients: "38",
      maskImages: false,
      sampleData: true,
    },
    {
      name: "BUS-BRA - A Breast Ultrasound Dataset",
      link: "https://www.kaggle.com/datasets/aryashah2k/breast-ultrasound-images-dataset",
      biRads: true,
      images: "1,875",
      patients: "1,064",
      maskImages: false,
      sampleData: true,
    },
  ];

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
            </ul>
          </motion.nav>
        )}
      </header>

      {/* Datasets Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-center mb-12 ${poppins.className}`}
          >
            Datasets
          </h2>

          {/* Mammographic Datasets Table */}
          <h3 className={`text-2xl font-semibold mb-6 ${poppins.className}`}>
            Mammographic Datasets
          </h3>
          <div className="overflow-x-auto mb-12">
            <table
              className={`min-w-full bg-white shadow-md rounded-lg ${inter.className}`}
            >
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Dataset Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    BI-RADS
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    No of Images or Samples
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    No of Patients
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Mask Images
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Image and View (CC)
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Image and View (MLO)
                  </th>
                </tr>
              </thead>
              <tbody>
                {mammographicDatasets.map((dataset, index) => (
                  <tr
                    key={index}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={dataset.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {dataset.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">{dataset.biRads ? "✔" : "✖"}</td>
                    <td className="px-4 py-3">{dataset.images}</td>
                    <td className="px-4 py-3">{dataset.patients}</td>
                    <td className="px-4 py-3">
                      {dataset.maskImages ? "✔" : "✖"}
                    </td>
                    <td className="px-4 py-3">{dataset.viewCC ? "✔" : "✖"}</td>
                    <td className="px-4 py-3">{dataset.viewMLO ? "✔" : "✖"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ultrasound Datasets Table */}
          <h3 className={`text-2xl font-semibold mb-6 ${poppins.className}`}>
            Ultrasound Datasets
          </h3>
          <div className="overflow-x-auto">
            <table
              className={`min-w-full bg-white shadow-md rounded-lg ${inter.className}`}
            >
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Dataset Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    BI-RADS
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    No of Images or Samples
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    No of Patients
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Mask Images
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Sample Data (Image)
                  </th>
                </tr>
              </thead>
              <tbody>
                {ultrasoundDatasets.map((dataset, index) => (
                  <tr
                    key={index}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={dataset.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {dataset.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">{dataset.biRads ? "✔" : "✖"}</td>
                    <td className="px-4 py-3">{dataset.images}</td>
                    <td className="px-4 py-3">{dataset.patients}</td>
                    <td className="px-4 py-3">
                      {dataset.maskImages ? "✔" : "✖"}
                    </td>
                    <td className="px-4 py-3">
                      {dataset.sampleData ? "✔" : "✖"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
