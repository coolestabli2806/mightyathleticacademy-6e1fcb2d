import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, Video, X, Play } from "lucide-react";

// Sample gallery data
const photos = [
  { id: 1, title: "Training Session", date: "Dec 2024" },
  { id: 2, title: "Team Practice", date: "Dec 2024" },
  { id: 3, title: "Skills Drill", date: "Nov 2024" },
  { id: 4, title: "Match Day", date: "Nov 2024" },
  { id: 5, title: "Warm Up", date: "Nov 2024" },
  { id: 6, title: "Goal Celebration", date: "Oct 2024" },
];

const videos = [
  { id: 1, title: "Highlights Reel", duration: "2:34" },
  { id: 2, title: "Skills Tutorial", duration: "5:12" },
  { id: 3, title: "Team Intro", duration: "1:45" },
];

// Generate placeholder colors for demo
const getPlaceholderColor = (id: number) => {
  const colors = [
    "from-primary/20 to-primary/40",
    "from-accent/20 to-accent/40",
    "from-success/20 to-success/40",
  ];
  return colors[id % colors.length];
};

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <Layout>
      <section className="py-20 bg-secondary min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Media Gallery</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Photos & Videos
            </h1>
            <p className="text-muted-foreground">
              Check out highlights from our training sessions and matches!
            </p>
          </div>

          <Tabs defaultValue="photos" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="photos" className="gap-2">
                <Camera className="w-4 h-4" />
                Photos
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="w-4 h-4" />
                Videos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="photos">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {photos.map((photo) => (
                  <Card 
                    key={photo.id}
                    className="overflow-hidden border-none shadow-card cursor-pointer group hover:shadow-card-hover transition-all duration-300"
                    onClick={() => setSelectedImage(photo.id)}
                  >
                    <div className={`aspect-[4/3] bg-gradient-to-br ${getPlaceholderColor(photo.id)} flex items-center justify-center relative`}>
                      <Camera className="w-12 h-12 text-muted-foreground/40" />
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground">{photo.title}</h3>
                      <p className="text-sm text-muted-foreground">{photo.date}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-muted-foreground mb-4">
                  Photos are added regularly after training sessions.
                </p>
                <Button variant="outline">
                  Load More Photos
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="videos">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card 
                    key={video.id}
                    className="overflow-hidden border-none shadow-card cursor-pointer group hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className={`aspect-video bg-gradient-to-br ${getPlaceholderColor(video.id)} flex items-center justify-center relative`}>
                      <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-primary-foreground ml-1" />
                      </div>
                      <span className="absolute bottom-3 right-3 bg-foreground/80 text-primary-foreground text-xs px-2 py-1 rounded">
                        {video.duration}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground">{video.title}</h3>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-muted-foreground">
                  More videos coming soon! Stay tuned for highlights and tutorials.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-foreground/80 text-primary-foreground hover:bg-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className={`aspect-[4/3] bg-gradient-to-br ${selectedImage ? getPlaceholderColor(selectedImage) : ""} flex items-center justify-center`}>
            <Camera className="w-24 h-24 text-muted-foreground/40" />
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
