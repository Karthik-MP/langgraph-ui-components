/*
 * There is a bug where `navigator.mediaDevices.getUserMedia` + `MediaRecorder`
 * creates WEBM files without duration metadata. See:
 * - https://bugs.chromium.org/p/chromium/issues/detail?id=642012
 * - https://stackoverflow.com/a/39971175/13989043
 *
 * This file contains a function that fixes the duration metadata of a WEBM file.
 *  - Answer found: https://stackoverflow.com/a/75218309/13989043
 *  - Code adapted from: https://github.com/mat-sz/webm-fix-duration
 *    (forked from: https://github.com/yusitnikov/fix-webm-duration)
 */

interface Section {
    name: string;
    type: string;
}

const sections: Record<number, Section> = {
    0xa45dfa3: { name: "EBML", type: "Container" },
    0x286: { name: "EBMLVersion", type: "Uint" },
    0x2f7: { name: "EBMLReadVersion", type: "Uint" },
    0x2f2: { name: "EBMLMaxIDLength", type: "Uint" },
    0x2f3: { name: "EBMLMaxSizeLength", type: "Uint" },
    0x282: { name: "DocType", type: "String" },
    0x287: { name: "DocTypeVersion", type: "Uint" },
    0x285: { name: "DocTypeReadVersion", type: "Uint" },
    0x6c: { name: "Void", type: "Binary" },
    0x489: { name: "Duration", type: "Float" },
    0x8538067: { name: "Segment", type: "Container" },
    0x549a966: { name: "Info", type: "Container" },
    0xad7b1: { name: "TimecodeScale", type: "Uint" },
};

class WebmBase<T> {
    source?: Uint8Array;
    data?: T;
    name: string;
    type: string;

    constructor(name = "Unknown", type = "Unknown") {
        this.name = name;
        this.type = type;
    }

    updateBySource() {}

    setSource(source: Uint8Array) {
        this.source = source;
        this.updateBySource();
    }

    updateByData() {}

    setData(data: T) {
        this.data = data;
        this.updateByData();
    }
}

class WebmUint extends WebmBase<string> {
    constructor(name: string, type: string) {
        super(name, type || "Uint");
    }

    updateBySource() {
        this.data = "";
        for (let i = 0; i < this.source!.length; i++) {
            const hex = this.source![i].toString(16);
            this.data += padHex(hex);
        }
    }

    updateByData() {
        const length = this.data!.length / 2;
        this.source = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            const hex = this.data!.substr(i * 2, 2);
            this.source[i] = parseInt(hex, 16);
        }
    }

    getValue() {
        return parseInt(this.data!, 16);
    }

    setValue(value: number) {
        this.setData(padHex(value.toString(16)));
    }
}

function padHex(hex: string) {
    return hex.length % 2 === 1 ? "0" + hex : hex;
}

class WebmFloat extends WebmBase<number> {
    constructor(name: string, type: string) {
        super(name, type || "Float");
    }

    getFloatArrayType() {
        return this.source && this.source.length === 4
            ? Float32Array
            : Float64Array;
    }
    
    updateBySource() {
        const byteArray = this.source!.slice().reverse();
        const floatArrayType = this.getFloatArrayType();
        const floatArray = new floatArrayType(byteArray.buffer as ArrayBuffer);
        this.data! = floatArray[0];
    }
    
    updateByData() {
        const floatArrayType = this.getFloatArrayType();
        const floatArray = new floatArrayType([this.data!]);
        const byteArray = new Uint8Array(floatArray.buffer as ArrayBuffer);
        this.source = byteArray.slice().reverse();
    }
    
    getValue() {
        return this.data;
    }
    
    setValue(value: number) {
        this.setData(value);
    }
}

interface ContainerData {
    id: number;
    idHex?: string;
    data: WebmBase<any>;
}

class WebmContainer extends WebmBase<ContainerData[]> {
    offset: number = 0;
    data: ContainerData[] = [];

    constructor(name: string, type: string) {
        super(name, type || "Container");
    }

    readByte() {
        return this.source![this.offset++];
    }
    
    readUint() {
        const firstByte = this.readByte();
        const bytes = 8 - firstByte.toString(2).length;
        let value = firstByte - (1 << (7 - bytes));
        for (let i = 0; i < bytes; i++) {
            value *= 256;
            value += this.readByte();
        }
        return value;
    }
    
    updateBySource() {
        let end: number | undefined = undefined;
        this.data = [];
        for (
            this.offset = 0;
            this.offset < this.source!.length;
            this.offset = end
        ) {
            const id = this.readUint();
            const len = this.readUint();
            end = Math.min(this.offset + len, this.source!.length);
            const data = this.source!.slice(this.offset, end);

            const info = sections[id] || { name: "Unknown", type: "Unknown" };
            let ctr: any = WebmBase;
            switch (info.type) {
                case "Container":
                    ctr = WebmContainer;
                    break;
                case "Uint":
                    ctr = WebmUint;
                    break;
                case "Float":
                    ctr = WebmFloat;
                    break;
            }
            const section = new ctr(info.name, info.type);
            section.setSource(data);
            this.data.push({
                id: id,
                idHex: id.toString(16),
                data: section,
            });
        }
    }
    
    writeUint(x: number, draft = false) {
        let bytes = 1, flag = 0x80;
        while (x >= flag && bytes < 8) {
            bytes++;
            flag *= 0x80;
        }

        if (!draft) {
            let value = flag + x;
            for (let i = bytes - 1; i >= 0; i--) {
                const c = value % 256;
                this.source![this.offset! + i] = c;
                value = (value - c) / 256;
            }
        }

        this.offset += bytes;
    }

    writeSections(draft = false) {
        this.offset = 0;
        for (let i = 0; i < this.data.length; i++) {
            const section = this.data[i],
                content = section.data.source,
                contentLength = content!.length;
            this.writeUint(section.id, draft);
            this.writeUint(contentLength, draft);
            if (!draft) {
                this.source!.set(content!, this.offset);
            }
            this.offset += contentLength;
        }
        return this.offset;
    }

    updateByData() {
        const length = this.writeSections(true);
        this.source = new Uint8Array(length);
        this.writeSections();
    }

    getSectionById(id: number) {
        for (let i = 0; i < this.data.length; i++) {
            const section = this.data[i];
            if (section.id === id) {
                return section.data;
            }
        }
        return undefined;
    }
}

class WebmFile extends WebmContainer {
    constructor(source: Uint8Array) {
        super("File", "File");
        this.setSource(source);
    }

    fixDuration(duration: number) {
        const segmentSection = this.getSectionById(0x8538067) as WebmContainer;
        if (!segmentSection) {
            return false;
        }

        const infoSection = segmentSection.getSectionById(0x549a966) as WebmContainer;
        if (!infoSection) {
            return false;
        }

        const timeScaleSection = infoSection.getSectionById(0xad7b1) as WebmFloat;
        if (!timeScaleSection) {
            return false;
        }

        let durationSection = infoSection.getSectionById(0x489) as WebmFloat;
        if (durationSection) {
            if (durationSection.getValue()! <= 0) {
                durationSection.setValue(duration);
            } else {
                return false;
            }
        } else {
            durationSection = new WebmFloat("Duration", "Float");
            durationSection.setValue(duration);
            infoSection.data.push({
                id: 0x489,
                data: durationSection,
            });
        }

        timeScaleSection.setValue(1000000);
        infoSection.updateByData();
        segmentSection.updateByData();
        this.updateByData();

        return true;
    }

    toBlob(type = "video/webm") {
        return new Blob([this.source!.buffer as ArrayBuffer], { type });
    }
}

export const webmFixDuration = (
    blob: Blob,
    duration: number,
    type = "video/webm",
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();

            reader.addEventListener("loadend", () => {
                try {
                    const result = reader.result as ArrayBuffer;
                    const file = new WebmFile(new Uint8Array(result));
                    if (file.fixDuration(duration)) {
                        resolve(file.toBlob(type));
                    } else {
                        resolve(blob);
                    }
                } catch (ex) {
                    reject(ex);
                }
            });

            reader.addEventListener("error", () => reject());

            reader.readAsArrayBuffer(blob);
        } catch (ex) {
            reject(ex);
        }
    });
};
