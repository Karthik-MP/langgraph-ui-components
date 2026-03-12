export default function Thinking() {
    return (
        <>
            <style>{`
                .loader-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    color: white;
                    user-select: none;
                    gap: 10px;
                }

                .loader {
                    width: 20px;
                    height: 20px;
                    aspect-ratio: 1 / 1;
                    border-radius: 50%;
                    background-color: transparent;
                    animation: loader-rotate 1.5s linear infinite;
                    z-index: 0;
                }

                @keyframes loader-rotate {
                    0% {
                        transform: rotate(90deg);
                        box-shadow:
                            0 1px 1px 0 #fff inset,
                            0 3px 5px 0 #ff5f9f inset,
                            0 4px 4px 0 #0693ff inset;
                    }
                    50% {
                        transform: rotate(270deg);
                        background: #7c0911;
                        box-shadow:
                            0 1px 1px 0 #fff inset,
                            0 3px 5px 0 #d60a47 inset,
                            0 4px 4px 0 #fbef19 inset;
                    }
                    100% {
                        transform: rotate(450deg);
                        box-shadow:
                            0 1px 1px 0 #fff inset,
                            0 3px 5px 0 #ff5f9f inset,
                            0 4px 4px 0 #28a9ff inset;
                    }
                }

                .letter-wrapper {
                    display: flex;
                    gap: 1px;
                }

                .loader-letter {
                    display: inline-block;
                    opacity: 0.4;
                    transform: translateY(0);
                    animation: loader-letter-anim 2s infinite;
                    z-index: 1;
                    border-radius: 50ch;
                    border: none;
                }

                .loader-letter:nth-child(1) { animation-delay: 0s; }
                .loader-letter:nth-child(2) { animation-delay: 0.1s; }
                .loader-letter:nth-child(3) { animation-delay: 0.2s; }
                .loader-letter:nth-child(4) { animation-delay: 0.3s; }
                .loader-letter:nth-child(5) { animation-delay: 0.4s; }
                .loader-letter:nth-child(6) { animation-delay: 0.5s; }
                .loader-letter:nth-child(7) { animation-delay: 0.6s; }
                .loader-letter:nth-child(8) { animation-delay: 0.7s; }

                @keyframes loader-letter-anim {
                    0%, 100% {
                        opacity: 0.4;
                        transform: translateY(0);
                    }
                    20% {
                        opacity: 1;
                        transform: scale(1.15);
                    }
                    40% {
                        opacity: 0.7;
                        transform: translateY(0);
                    }
                }
            `}</style>
            <div className="loader-wrapper">
<div className="letter-wrapper">
                    <span className="loader-letter">T</span>
                    <span className="loader-letter">h</span>
                    <span className="loader-letter">i</span>
                    <span className="loader-letter">n</span>
                    <span className="loader-letter">k</span>
                    <span className="loader-letter">i</span>
                    <span className="loader-letter">n</span>
                    <span className="loader-letter">g</span>
                </div>
            </div>
        </>
    )
}
