import { useStreamContext } from "@/providers/Stream";
import { useCustomComponents } from "@/providers/CustomComponentProvider";
import type { Message } from "@langchain/langgraph-sdk";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Fragment } from "react/jsx-runtime";
import React from "react";
import { logger } from "@/utils/logger";

function CustomComponentRender({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const { components } = useCustomComponents();
  
  // Memoize filtered components to prevent unnecessary re-renders
  const customComponents = React.useMemo(() => {
    return values.ui?.filter((ui) =>
      ui?.metadata?.id === message.id || ui?.metadata?.message_id === message.id || ui?.id === message.id
    );
  }, [values.ui, message.id]);

  logger.debug("CustomComponentRender - customComponents:", message);
  logger.debug("CustomComponentRender - available components:", values);


  if (!customComponents?.length) return null;
  
  return (
    <Fragment>
      {customComponents
        ?.filter((c) => !!components?.[c.name as keyof typeof components])
        .map((customComponent, index) => {
          // Extract props from the UI message to pass to the component
          const componentProps = (customComponent as any).props || {};

          return (
            <LoadExternalComponent
              key={(customComponent as any)._key || `${message.id}-${customComponent.id || index}`}
              stream={thread as any}
              message={customComponent}
              components={components}
              meta={{ ...componentProps, ui: customComponent }}
            />
          );
        })}
    </Fragment>
  );
}

export default React.memo(CustomComponentRender);