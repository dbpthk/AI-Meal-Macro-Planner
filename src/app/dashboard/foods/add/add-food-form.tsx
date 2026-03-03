"use client";

import { useState } from "react";
import { FoodImageUpload } from "@/components/food-image-upload";
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

export function AddFoodForm() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food details</CardTitle>
        <CardDescription>
          Add a food item with optional image. Image uploads use secure
          server-signed URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image">Food image</Label>
          <FoodImageUpload
            value={imageUrl}
            onChange={setImageUrl}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g. Chicken breast" />
        </div>
        <p className="text-sm text-muted-foreground">
          Full food form (name, macros, etc.) coming soon. Image upload is ready.
        </p>
        <Button type="button" disabled>
          Save food (coming soon)
        </Button>
      </CardContent>
    </Card>
  );
}
