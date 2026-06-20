import { useTranslation } from "react-i18next";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalCloseButton } from "#/components/shared/modals/modal-close-button";
import { Typography } from "#/ui/typography";
import { I18nKey } from "#/i18n/declaration";

interface SystemMessageHeaderProps {
  agentClass: string | null;
  bezotcorpVersion: string | null;
  onClose: () => void;
}

export function SystemMessageHeader({
  agentClass,
  bezotcorpVersion,
  onClose,
}: SystemMessageHeaderProps) {
  const { t } = useTranslation("bezotcorp");

  return (
    <>
      <ModalCloseButton onClose={onClose} testId="close-system-message-modal" />
      <div className="flex w-full min-w-0 flex-col gap-2 pr-6">
        <BaseModalTitle title={t(I18nKey.SYSTEM_MESSAGE_MODAL$TITLE)} />
        {(agentClass || bezotcorpVersion) && (
          <div className="flex flex-col gap-2">
            {agentClass && (
              <div className="text-sm">
                <Typography.Text className="font-semibold text-[var(--oh-text-tertiary)]">
                  {t(I18nKey.SYSTEM_MESSAGE_MODAL$AGENT_CLASS)}
                </Typography.Text>{" "}
                <Typography.Text className="font-medium text-content-2">
                  {agentClass}
                </Typography.Text>
              </div>
            )}
            {bezotcorpVersion && (
              <div className="text-sm">
                <Typography.Text className="font-semibold text-[var(--oh-text-tertiary)]">
                  {t(I18nKey.SYSTEM_MESSAGE_MODAL$BEZOTCORP_VERSION)}
                </Typography.Text>{" "}
                <Typography.Text className="text-content-2">
                  {bezotcorpVersion}
                </Typography.Text>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
