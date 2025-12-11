import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, Trophy } from "lucide-react";
import heroImage from "@/assets/hero-soccer.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Youth soccer training session at golden hour"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground">Building Champions Since 2024</span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
            Unlock Your Child's
            <span className="block text-accent">Soccer Potential</span>
          </h1>
          
          <p className="text-lg text-primary-foreground/80 mb-8 leading-relaxed max-w-xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Professional coaching for young athletes. Join our academy and watch your child 
            develop skills, discipline, and a love for the beautiful game.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/register">
              <Button variant="hero" size="xl">
                Register Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                View Schedule
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-primary-foreground/20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-accent" />
                <span className="font-heading font-bold text-2xl text-primary-foreground">50+</span>
              </div>
              <span className="text-sm text-primary-foreground/70">Active Players</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-accent" />
                <span className="font-heading font-bold text-2xl text-primary-foreground">4x</span>
              </div>
              <span className="text-sm text-primary-foreground/70">Weekly Sessions</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="font-heading font-bold text-2xl text-primary-foreground">100%</span>
              </div>
              <span className="text-sm text-primary-foreground/70">Dedicated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
