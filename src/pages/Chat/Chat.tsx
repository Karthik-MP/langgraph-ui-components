import ChatBodyComponent from "@/components/ChatBody";
import ChatInput from "@/components/sidebar/ChatInput";
import ThreadHistory from "@/components/threads/ThreadHistory";
import { useState } from "react";

export default function Chat() {
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    return (
        <div className="flex h-screen w-screen bg-[#0f0f0f] text-white">
            <ThreadHistory />
            <main className="flex flex-1 flex-col">
                {/* Header */}
                <header className="flex h-14 items-center justify-between border-b border-white/10 px-6">
                    <span className="text-sm text-white/80">ChatGPT 5.2s</span>
                    {/* <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                    </div> */}
                </header>

                {/* CONTENT AREA */}
                <div className="relative flex flex-1 overflow-hidden">
                    {isFirstMessage ? <div className="flex flex-1 flex-col items-center justify-center">
                        <h1 className="mb-8 text-2xl font-medium text-white/80">
                            What are you working on?
                        </h1>

                        <div className="w-full max-w-2xl px-4">
                            <ChatInput input="" setInput={() => { }} handleSubmit={() => { }} fileInput={[]} setFileInput={() => { }} handleFileSelect={() => { }} />
                        </div>
                    </div> :
                        // =========================
                        // CHAT STATE (after message)
                        // =========================
                        <div className="flex h-full w-full flex-col">
                            <div className="flex-1 overflow-y-auto">
                                <div className="mx-auto max-w-3xl px-4 py-6">
                                    <ChatBodyComponent />
                                </div>
                            </div>

                            <div className="border-t border-white/10 px-4 py-4">
                                <div className="mx-auto max-w-3xl">
                                    <ChatInput input="" setInput={() => { }} handleSubmit={() => { }} fileInput={[]} setFileInput={() => { }} handleFileSelect={() => { }} />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </main>
        </div>
    )
}
