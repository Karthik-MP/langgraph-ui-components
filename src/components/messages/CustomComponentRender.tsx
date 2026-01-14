import { useStreamContext } from "@/providers/Stream";
import { useCustomComponents } from "@/providers/CustomComponentProvider";
import type { Message } from "@langchain/langgraph-sdk";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Fragment } from "react/jsx-runtime";
import React from "react";

function CustomComponentRender({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui?.id === message.id
  );
  const { components } = useCustomComponents();

  if (!customComponents?.length) return null;
  
  return (
    <Fragment>
      {customComponents
        ?.filter((c) => !!components?.[c.name as keyof typeof components])
        .map((customComponent) => (
          <LoadExternalComponent
            key={`${message.id}-${customComponent.id}`}
            stream={thread}
            message={customComponent}
            components={components}
            meta={{ ui: customComponent }}
          />
        ))}
    </Fragment>
  );
}

export default React.memo(CustomComponentRender, (prevProps, nextProps) => {
  return prevProps.message.id === nextProps.message.id;
});