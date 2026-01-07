import { useStreamContext } from "@/providers/Stream";
import type { Message } from "@langchain/langgraph-sdk";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Fragment } from "react/jsx-runtime";

export function CustomComponentRender({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
    // console.log("CustomComponentRender called", message);
    // msg="lc_run--019b9a27-9cb6-73c1-869e-d42df17ace4b""

    //   const artifact = useArtifact();
  const { values } = useStreamContext();
  // console.log("CustomComponentRender - values:", values);
  console.log("CustomComponentRender - message ID:", message.id);
  console.log("CustomComponentRender - values.ui:", values.ui);
  const customComponents = values.ui?.filter(
    (ui) => ui?.id === message.id
  );

  // console.log("CustomComponentRender", { message, customComponents });

  function loginComponents() {
    return <div>Login Component</div>;
  }

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          //   meta={{ ui: customComponent, artifact }}
          components={{ LoginForm: loginComponents }}
          meta={{ ui: customComponent }}
        />
      ))}
    </Fragment>
  );
}
