"use client";

import { useState } from "react";
import { FoodImageUpload } from "@/components/food-image-upload";
import { detectFoodFromImage } from "@/app/actions/detect-food";
import type { DetectedFoodItem } from "@/app/actions/detect-food";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Scan } from "lucide-react";

export function AddFoodForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedFoodItem[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  async function handleDetect() {
    if (!imageUrl) return;
    setDetecting(true);
    setDetectError(null);
    setDetectedItems([]);
    try {
      const result = await detectFoodFromImage(imageUrl);
      if (result.error) {
        setDetectError(result.error);
      } else if (result.items) {
        setDetectedItems(result.items);
      }
    } finally {
      setDetecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food details</CardTitle>
        <CardDescription>
          Upload an image to detect food items and estimated weights via AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Food image</Label>
          <FoodImageUpload
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              if (!url) {
                setDetectedItems([]);
                setDetectError(null);
              }
            }}
          />
          {imageUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDetect}
              disabled={detecting}
            >
              {detecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  Detect food
                </>
              )}
            </Button>
          )}
        </div>
        {detectError && (
          <p className="text-sm text-destructive">{detectError}</p>
        )}
        {detectedItems.length > 0 && (
          <div className="space-y-2">
            <Label>Detected food items</Label>
            <ul className="space-y-2 rounded-lg border bg-muted/30 p-3">
              {detectedItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">
                    ~{item.estimatedWeightG}g
                    {item.confidence != null && (
                      <span className="ml-1 text-xs">
                        ({Math.round(item.confidence * 100)}%)
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g. Chicken breast" />
        </div>
        <p className="text-sm text-muted-foreground">
          Full food form (name, macros, etc.) coming soon.
        </p>
        <Button type="button" disabled>
          Save food (coming soon)
        </Button>
      </CardContent>
    </Card>
  );
}
