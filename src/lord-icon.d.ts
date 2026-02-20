// Type declarations for Lordicon web component (<lord-icon>)
// https://lordicon.com/docs/web

declare namespace React {
    namespace JSX {
        interface IntrinsicElements {
            'lord-icon': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & {
                    src?: string;
                    trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang';
                    colors?: string;
                    stroke?: string | number;
                    delay?: number | string;
                    target?: string;
                    state?: string;
                },
                HTMLElement
            >;
        }
    }
}
