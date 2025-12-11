import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          Ready to Join the Team?
        </h2>
        <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
          Spots are limited! Register your child today and give them the foundation 
          to become a confident, skilled soccer player.
        </p>
        <Link to="/register">
          <Button variant="hero" size="xl">
            Register Your Child
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
