import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Mail, MessageSquare, Upload } from 'lucide-react';

export const metadata = {
  title: 'Media Gallery | League of Degenerates',
  description: 'Photos and videos from league history',
};

export default function MediaPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Camera className="h-8 w-8" />
          Media Gallery
        </h1>
        <p className="text-muted-foreground mt-2">
          Photos and videos from league history
        </p>
      </div>

      {/* Submit Media CTA */}
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">Have photos or videos to share?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send your draft day pics, championship celebrations, or shame moments to the commissioner!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Text
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">League Moments</h2>

        <div className="grid gap-6">
          {/* Vegas Entrance Video */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vegas Draft Entrance</CardTitle>
                  <CardDescription>The legendary arrival</CardDescription>
                </div>
                <Badge>Video</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  controls
                  className="w-full h-full object-contain"
                  poster=""
                  preload="metadata"
                >
                  <source src="/Vegasentrance.MOV" type="video/quicktime" />
                  <source src="/Vegasentrance.MOV" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="bg-muted/20">
        <CardContent className="py-8 text-center">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            More photos and videos coming soon!
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Send your media to the commissioner to be featured here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
