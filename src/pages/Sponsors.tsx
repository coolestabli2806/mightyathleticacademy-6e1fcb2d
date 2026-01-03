import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchSponsors();
  }, []);

  useEffect(() => {
    // Scroll to sponsor if hash is present
    if (location.hash && !loading && sponsors.length > 0) {
      const sponsorId = location.hash.replace('#', '');
      const element = document.getElementById(`sponsor-${sponsorId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }, 100);
      }
    }
  }, [location.hash, loading, sponsors]);

  const fetchSponsors = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching sponsors:', error);
    } else {
      setSponsors(data || []);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <section className="py-20 bg-secondary min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Heart className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Our Partners</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Sponsors
            </h1>
            <p className="text-muted-foreground">
              We are grateful to our sponsors who support the development of young athletes 
              at Mighty Athletic Academy.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading sponsors...</div>
          ) : sponsors.length === 0 ? (
            <div className="text-center py-12">
              <Card className="max-w-md mx-auto border-none shadow-card">
                <CardContent className="p-8">
                  <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    Become a Sponsor
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Interested in supporting young athletes? Contact us to learn about 
                    sponsorship opportunities.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {sponsors.map((sponsor) => (
                <Card key={sponsor.id} id={`sponsor-${sponsor.id}`} className="border-none shadow-card hover:shadow-card-hover transition-all duration-300">
                  <CardContent className="p-6">
                    {sponsor.logo_url ? (
                      <div className="h-32 flex items-center justify-center mb-4 bg-background rounded-lg p-4">
                        <img 
                          src={sponsor.logo_url} 
                          alt={sponsor.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center mb-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
                        <span className="font-heading text-2xl font-bold text-primary/60">
                          {sponsor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                      {sponsor.name}
                    </h3>
                    {sponsor.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {sponsor.description}
                      </p>
                    )}
                    {sponsor.website_url && (
                      <a 
                        href={sponsor.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-16">
            <Card className="inline-block border-none shadow-card">
              <CardContent className="p-6">
                <p className="text-muted-foreground text-sm">
                  Want to become a sponsor?{" "}
                  <a href="mailto:mightyathleticacademy@gmail.com" className="text-primary hover:underline font-medium">
                    Contact us
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
