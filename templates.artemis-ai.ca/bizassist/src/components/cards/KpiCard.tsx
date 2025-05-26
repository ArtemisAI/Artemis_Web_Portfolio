import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType; // Allow passing Lucide icon components
  description?: string;
  footerText?: string; // Optional text for the footer
  cardClassName?: string; // Allow custom classes for the Card itself
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, description, footerText, cardClassName }) => {
  return (
    <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out", cardClassName)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-navy font-heading">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-5 w-5 text-orange" />}
        </div>
        {description && (
          <CardDescription className="text-xs text-gray-500 pt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-navy font-sans">
          {value}
        </div>
      </CardContent>
      {footerText && (
        <CardFooter>
          <p className="text-xs text-gray-500">{footerText}</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default KpiCard;
