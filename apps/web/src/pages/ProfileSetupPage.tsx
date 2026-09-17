import React, { useEffect } from "react";
import { useAppLayout } from "@/layouts/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileSetupWizard } from "@/features/profile/components/ProfileSetupWizard";

export const ProfileSetupPage: React.FC = () => {
  const { setTitle, setSubtitle } = useAppLayout();

  useEffect(() => {
    setTitle("Profile setup");
    setSubtitle("Shape a profile that feels true to you.");
  }, [setSubtitle, setTitle]);

  return (
    <PageContainer maxWidth="md">
      <ProfileSetupWizard />
    </PageContainer>
  );
};
