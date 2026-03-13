import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(0,212,255,0.12)] bg-[#0D1B2A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 border border-[#00D4FF] rounded flex items-center justify-center">
                <span className="font-mono text-[#00D4FF] text-sm font-bold">N&N</span>
              </div>
              <span className="font-heading text-lg text-[#E8F4FD] tracking-widest">
                AUDIO <span className="text-[#00D4FF]">SYSTEMS</span>
              </span>
            </div>
            <p className="text-[#4A7FA5] text-sm leading-relaxed">
              Precision audio equipment crafted for audiophiles.
              Made in India. Trusted worldwide.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-heading text-[#E8F4FD] tracking-widest mb-4">PRODUCTS</h4>
            <ul className="space-y-2 text-sm text-[#4A7FA5]">
              {['Amplifiers', 'Speakers', 'Subwoofers', 'Processors', 'Cables'].map((p) => (
                <li key={p}>
                  <Link
                    href={`/products?category=${p.toLowerCase()}`}
                    className="hover:text-[#00D4FF] transition-colors"
                  >
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-heading text-[#E8F4FD] tracking-widest mb-4">ACCOUNT</h4>
            <ul className="space-y-2 text-sm text-[#4A7FA5]">
              {[
                { href: '/auth/login', label: 'Login' },
                { href: '/auth/register', label: 'Register' },
                { href: '/account/orders', label: 'My Orders' },
                { href: '/account/profile', label: 'Profile' },
                { href: '/account/addresses', label: 'Addresses' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[#00D4FF] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-[#E8F4FD] tracking-widest mb-4">CONNECT</h4>
            <ul className="space-y-2 text-sm text-[#4A7FA5]">
              <li>Name : Naseeruddin</li>
              <li>Ph : 9700929591</li>
              <li className="pt-2">
                <span className="font-mono text-xs text-[#00D4FF]">MON–SAT 10:00–18:00 IST</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[rgba(0,212,255,0.08)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#4A7FA5] text-xs font-mono">
            © {new Date().getFullYear()} N &amp; N AUDIO SYSTEMS. ALL RIGHTS RESERVED.
          </p>
          <p className="text-[#4A7FA5] text-xs font-mono">
            PRECISION AUDIO · MADE IN INDIA
          </p>
        </div>
      </div>
    </footer>
  )
}
