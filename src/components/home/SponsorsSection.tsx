import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Handshake } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

export function SponsorsSection() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setSponsors(data);
    }
    setLoading(false);
  };

  if (loading || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Handshake className="w-4 h-4" />
            <span className="text-sm font-medium">Our Partners</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Sponsors
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're grateful to our amazing sponsors who support our mission to develop young athletes.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {sponsors.map((sponsor) => (
            <Link
              key={sponsor.id}
              to={`/sponsors#${sponsor.id}`}
              className="group transition-all duration-300 hover:scale-105"
              title={sponsor.name}
            >
              {sponsor.logo_url ? (
                <img
                  src={sponsor.logo_url}
                  alt={sponsor.name}
                  className="h-16 md:h-20 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                />
              ) : (
                <div className="h-16 md:h-20 w-32 md:w-40 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-medium group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {sponsor.name}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/sponsors"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View All Sponsors →
          </Link>
        </div>
      </div>
    </section>
  );
}
