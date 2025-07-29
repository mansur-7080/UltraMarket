import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer>
      {/* Featured Brands Section */}
      <div className="bg-white py-8">
        <div className="container max-w-[1400px] mx-auto px-4">
          <h3 className="text-xl font-bold mb-6 text-center">Featured Brands</h3>
          <div className="flex justify-center items-center gap-12 flex-wrap">
            <img src="https://c1.neweggimages.com/WebResource/Themes/Nest/manufacturers/logo009.png" alt="ABS" className="h-10 opacity-60 hover:opacity-100 transition-opacity" />
            <img src="https://c1.neweggimages.com/WebResource/Themes/Nest/manufacturers/logo234.png" alt="AMD" className="h-10 opacity-60 hover:opacity-100 transition-opacity" />
            <img src="https://c1.neweggimages.com/WebResource/Themes/Nest/manufacturers/logo1169.png" alt="ASUS" className="h-10 opacity-60 hover:opacity-100 transition-opacity" />
            <span className="text-gray-500 font-bold text-lg opacity-60 hover:opacity-100 transition-opacity">ASRock</span>
            <span className="text-gray-500 font-bold text-lg opacity-60 hover:opacity-100 transition-opacity">GIGABYTE</span>
            <span className="text-gray-500 font-bold text-lg opacity-60 hover:opacity-100 transition-opacity">INTEL</span>
          </div>
        </div>
      </div>

      {/* About Newegg Section */}
      <div className="bg-gray-50 py-8">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="text-sm text-gray-600 leading-relaxed space-y-4">
            <p>
              Make Newegg your one-stop electronics store for technology, consumer electronics, gaming components, and more! Newegg
              is an online electronics store based in North America. Its global reach as a go-to tech store extends into Europe, South
              America, Asia Pacific, and the Middle East. With competitive pricing and frequent promotions, Newegg features a diverse range
              of in-demand electronics and tech products. Online electronics shopping can be tricky, but Newegg spotlights products from
              well-known, quality, reliable brands. Whether you are buying electronics to outfit your home office, upgrading your mobile
              device or home entertainment system, or searching for tech accessories, Newegg has a comprehensive selection of the
              electronics and tech products that consumers want. Choose Newegg's online tech store as your ultimate shopping destination
              for buying electronics.
            </p>
            <p>
              Newegg offers user-friendly tools to simplify electronics shopping. Use our Laptop Finder for tailored laptop recommendations,
              our Gaming PC Finder for custom gaming rigs, and our Power Supply Calculator for PC builds. With our PC Builder, compare
              components and save builds. Explore our configurators for NAS solutions and custom Server Systems. Simplify RAM selection
              with our Memory Finder. Explore the ease and convenience of electronics shopping in our online technology store with
              Newegg's comprehensive selection of tools.
            </p>
            <p>
              Newegg proudly boasts a vibrant community of over 4 million tech enthusiasts worldwide! Driven by customer engagement
              and a shared passion for technology, we've built an industry-leading reputation for reliability and excellence. Discover an
              expansive selection of PC components, consumer electronics, smart home devices, and gaming products on our trusted
              online platform. Immerse yourself in hands-on demos and expert video reviews at Newegg Studios, where we offer valuable insights
              into the latest tech trends. Join our community today and embark on a journey to explore the world of tech with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 py-12 text-white">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-2">Deals Just For You</h3>
              <p className="mb-4 opacity-90">Sign up to receive exclusive offers in your inbox.</p>
              <div className="flex mb-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-2 rounded-l text-gray-900 focus:outline-none"
                />
                <button className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-r font-medium transition-colors">
                  Sign up
                </button>
              </div>
              <a href="#" className="text-sm opacity-75 hover:opacity-100">View Latest Email Deals</a>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Download Our APP</h3>
              <p className="mb-4 opacity-90">Enter your phone number and we'll send you a download link.</p>
              <div className="flex mb-4">
                <select className="px-3 py-2 rounded-l text-gray-900 bg-white focus:outline-none">
                  <option>+1</option>
                </select>
                <input
                  type="tel"
                  placeholder="Enter your phone"
                  className="flex-1 px-4 py-2 text-gray-900 focus:outline-none"
                />
                <button className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-r font-medium transition-colors">
                  Send Link
                </button>
              </div>
              <div className="text-center">
                <span className="text-sm opacity-75">OR</span>
                <p className="text-sm opacity-75 mt-2">Scan this QR code to download App</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="bg-[#2B3440] text-white py-12">
        <div className="container max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Customer Service */}
            <div>
              <h4 className="font-bold mb-4 text-white">CUSTOMER SERVICE</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Track an Order</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Return an Item</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Return Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Privacy & Security</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Feedback</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Address Book</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Wish Lists</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">My Build Lists</a></li>
              </ul>
            </div>

            {/* My Account */}
            <div>
              <h4 className="font-bold mb-4 text-white">MY ACCOUNT</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white">Login/Register</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Browsing History</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Order History</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Returns History</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Address Book</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Wish Lists</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Email Notifications</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Subscriptions Orders</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Auto Notifications</a></li>
              </ul>
            </div>

            {/* Company Information */}
            <div>
              <h4 className="font-bold mb-4 text-white">COMPANY INFORMATION</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white">About Newegg</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Investor Relations</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Newegg Student Internship Program</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Awards/Rankings</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Newegg Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Newsroom</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Newegg Insider</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Press Inquiries</a></li>
              </ul>
            </div>

            {/* Tools & Resources */}
            <div>
              <h4 className="font-bold mb-4 text-white">TOOLS & RESOURCES</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white">Become a supplier</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Sell on Newegg.com</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">For Your Business</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Newegg Partner Services</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Become an Affiliate</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Newegg Creators</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Site Map</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Shop by Brand</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Rebates</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Mobile Apps</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-[#1F2937] border-t border-gray-700">
        <div className="container max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2000-2025 Newegg Inc. All rights reserved.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300 mr-4">Terms & Conditions</a>
              <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
