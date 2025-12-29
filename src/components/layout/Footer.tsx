import { Trophy, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-xl">
                Mighty Athletic Academy
              </span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Building tomorrow's champions through professional athletic training 
              with Coach David Maldonado.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link to="/schedule" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Weekly Schedule
              </Link>
              <Link to="/register" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Register Now
              </Link>
              <Link to="/gallery" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Photo Gallery
              </Link>
              <Link to="/sponsors" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                Our Sponsors
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Contact Us</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <Mail className="w-4 h-4" />
                <span className="text-sm">mightyathleticacademy@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <Phone className="w-4 h-4" />
                <span className="text-sm">804-901-4427</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/80">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Deep Run Park / Glover Park</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60 text-sm">
          © {new Date().getFullYear()} Mighty Athletic Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
