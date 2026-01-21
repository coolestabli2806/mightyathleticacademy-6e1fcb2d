import { useState } from "react";
import { format } from "date-fns";
import { formatDateOnly } from "@/lib/dateOnly";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, AlertTriangle } from "lucide-react";

interface Registration {
  id: string;
  child_name: string;
  date_of_birth: string;
  parent_name: string;
  email: string;
  phone: string;
}

interface WaiverFormProps {
  registration: Registration;
  existingWaiver?: {
    id: string;
    parent_signature: string;
    parent_signed_date: string;
    player_signature?: string;
    player_signed_date?: string;
  } | null;
  onWaiverSigned: () => void;
}

export function WaiverForm({ registration, existingWaiver, onWaiverSigned }: WaiverFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [healthParticipation, setHealthParticipation] = useState(true);
  const [emergencyMedical, setEmergencyMedical] = useState(true);
  const [concussionAwareness, setConcussionAwareness] = useState(true);
  const [mediaConsent, setMediaConsent] = useState(true);
  const [parentSignature, setParentSignature] = useState("");
  const [playerSignature, setPlayerSignature] = useState("");

  const todayDate = format(new Date(), "MMMM d, yyyy");

  const handleSubmit = async () => {
    if (!healthParticipation || !emergencyMedical || !concussionAwareness) {
      toast({
        title: "Required Acknowledgments",
        description: "Please check all required acknowledgments before signing.",
        variant: "destructive"
      });
      return;
    }

    if (!parentSignature.trim()) {
      toast({
        title: "Signature Required",
        description: "Please enter your signature to complete the waiver.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("waivers").insert({
        registration_id: registration.id,
        parent_email: registration.email,
        player_name: registration.child_name,
        player_dob: registration.date_of_birth,
        parent_guardian_name: registration.parent_name,
        phone_email: `${registration.phone} / ${registration.email}`,
        health_participation: healthParticipation,
        emergency_medical: emergencyMedical,
        concussion_awareness: concussionAwareness,
        media_consent: mediaConsent,
        parent_signature: parentSignature.trim(),
        parent_signed_date: formatDateOnly(new Date()),
        player_signature: playerSignature.trim() || null,
        player_signed_date: playerSignature.trim() ? formatDateOnly(new Date()) : null
      });

      if (error) throw error;

      toast({
        title: "Waiver Signed Successfully",
        description: "Thank you for signing the injury waiver."
      });
      
      onWaiverSigned();
    } catch (error: any) {
      toast({
        title: "Error Submitting Waiver",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If waiver already exists, show signed status
  if (existingWaiver) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <FileCheck className="w-5 h-5" />
            Waiver Signed
          </CardTitle>
          <CardDescription>
            Signed on {format(new Date(existingWaiver.parent_signed_date), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p><span className="font-medium text-muted-foreground">Player:</span> {registration.child_name}</p>
            <p><span className="font-medium text-muted-foreground">Date of Birth:</span> {registration.date_of_birth}</p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="font-medium text-foreground">Acknowledged Consents:</p>
            
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <div className="w-4 h-4 mt-0.5 rounded border border-green-600 bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium">Health & Participation</p>
                <p className="text-muted-foreground">
                  I agree to bring my child to practices or games only if they are in good health. 
                  I understand that participating while ill or injured could put my child and others at risk.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <div className="w-4 h-4 mt-0.5 rounded border border-green-600 bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium">Emergency Medical Treatment</p>
                <p className="text-muted-foreground">
                  I authorize coaches or representatives to seek medical care, including transport 
                  to a hospital, if necessary.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <div className="w-4 h-4 mt-0.5 rounded border border-green-600 bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-green-700 text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium">Concussion Awareness</p>
                <p className="text-muted-foreground">
                  I understand the risks of concussions and agree to notify coaches if my child shows 
                  any symptoms. Medical clearance is required before returning to play.
                </p>
              </div>
            </div>

            {existingWaiver && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <div className={`w-4 h-4 mt-0.5 rounded border ${existingWaiver.media_consent ? 'border-green-600 bg-green-100' : 'border-gray-300 bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                  {existingWaiver.media_consent && <span className="text-green-700 text-xs">✓</span>}
                </div>
                <div>
                  <p className="font-medium">Media Consent</p>
                  <p className="text-muted-foreground">
                    I grant permission for the team/league to use photos, video, or media featuring 
                    my child for promotional purposes.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <p><span className="font-medium text-muted-foreground">Parent Signature:</span> {existingWaiver.parent_signature}</p>
            {existingWaiver.player_signature && (
              <p><span className="font-medium text-muted-foreground">Player Signature:</span> {existingWaiver.player_signature}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Soccer Injury Waiver & Release of Liability
        </CardTitle>
        <CardDescription>
          Please read carefully and sign below for {registration.child_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
          <div>
            <span className="text-muted-foreground">Player Name:</span>
            <p className="font-medium">{registration.child_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Date of Birth:</span>
            <p className="font-medium">{registration.date_of_birth}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Parent/Guardian:</span>
            <p className="font-medium">{registration.parent_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Phone/Email:</span>
            <p className="font-medium text-xs">{registration.phone} / {registration.email}</p>
          </div>
        </div>

        {/* Waiver Text */}
        <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
          <p>
            I, the parent/guardian of the above-named player, acknowledge that participation in soccer 
            involves physical activity and carries the risk of injury, including sprains, fractures, 
            concussions, or other harm. I understand that soccer is a contact sport, and injuries may 
            occur despite coaching and safety precautions.
          </p>
          <p>
            I release and hold harmless Mighty Athletic Academy, its coaches, volunteers, officials, 
            and representatives from any claims, demands, or liability arising from injury, illness, 
            or damage sustained during practices, games, or related activities. I assume full 
            responsibility for any medical expenses incurred.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="health" 
              checked={healthParticipation}
              disabled
              onCheckedChange={(checked) => setHealthParticipation(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="health" className="font-medium cursor-pointer">
                Health & Participation <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                I agree to bring my child to practices or games only if they are in good health. 
                I understand that participating while ill or injured could put my child and others at risk.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="emergency" 
              checked={emergencyMedical}
              disabled
              onCheckedChange={(checked) => setEmergencyMedical(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="emergency" className="font-medium cursor-pointer">
                Emergency Medical Treatment <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                I authorize coaches or representatives to seek medical care, including transport 
                to a hospital, if necessary.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="concussion" 
              checked={concussionAwareness}
              disabled
              onCheckedChange={(checked) => setConcussionAwareness(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="concussion" className="font-medium cursor-pointer">
                Concussion Awareness <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                I understand the risks of concussions and agree to notify coaches if my child shows 
                any symptoms. Medical clearance is required before returning to play.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="media" 
              checked={mediaConsent}
              disabled
              onCheckedChange={(checked) => setMediaConsent(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="media" className="font-medium cursor-pointer">
                Media Consent <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                I grant permission for the team/league to use photos, video, or media featuring 
                my child for promotional purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Text */}
        <div className="p-4 border rounded-lg bg-amber-50/50 border-amber-200">
          <p className="text-sm font-medium text-amber-800">
            By signing below, I acknowledge that I have read, understand, and agree to this waiver 
            and its terms.
          </p>
        </div>

        {/* Signature Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentSignature">
                Parent/Guardian Signature <span className="text-destructive">*</span>
              </Label>
              <Input
                id="parentSignature"
                placeholder="Type your full name as signature"
                value={parentSignature}
                onChange={(e) => setParentSignature(e.target.value)}
                className="font-cursive italic"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={todayDate} disabled className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerSignature">
                Player Signature <span className="text-muted-foreground">(if applicable)</span>
              </Label>
              <Input
                id="playerSignature"
                placeholder="Player's name (optional)"
                value={playerSignature}
                onChange={(e) => setPlayerSignature(e.target.value)}
                className="font-cursive italic"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input value={playerSignature ? todayDate : ""} disabled className="bg-muted" />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Submitting..." : "Sign Waiver"}
        </Button>
      </CardContent>
    </Card>
  );
}
