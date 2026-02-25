import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { SlashCommandMenu } from './slash-command-menu';
import {
  Type,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Table,
  Info,
} from 'lucide-react';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return [
            {
              title: 'Text',
              description: 'Just start typing with plain text.',
              icon: Type,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('paragraph').run();
              },
            },
            {
              title: 'To-do list',
              description: 'Track tasks with a to-do list.',
              icon: CheckSquare,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleTaskList().run();
              },
            },
            {
              title: 'Heading 1',
              description: 'Big section heading.',
              icon: Heading1,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
              },
            },
            {
              title: 'Heading 2',
              description: 'Medium section heading.',
              icon: Heading2,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
              },
            },
            {
              title: 'Heading 3',
              description: 'Small section heading.',
              icon: Heading3,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
              },
            },
            {
              title: 'Bullet list',
              description: 'Create a simple bullet list.',
              icon: List,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
              },
            },
            {
              title: 'Numbered list',
              description: 'Create a list with numbering.',
              icon: ListOrdered,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
              },
            },
            {
              title: 'Quote',
              description: 'Create block quote.',
              icon: Quote,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
              },
            },
            {
              title: 'Code',
              description: 'Insert code snippet.',
              icon: Code,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
              },
            },
            {
              title: 'Divider',
              description: 'Insert horizontal rule divider.',
              icon: Minus,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
              },
            },
            // TODO: Uncomment when ready to enable Image upload
            // {
            //   title: 'Image',
            //   description: 'Upload any image from your device.',
            //   icon: '🖼️',
            //   command: ({ editor, range }: any) => {
            //     editor.chain().focus().deleteRange(range).run();
            //     const input = document.createElement('input');
            //     input.type = 'file';
            //     input.accept = 'image/*';
            //     input.onchange = (e: any) => {
            //       const file = e.target?.files?.[0];
            //       if (file) {
            //         const reader = new FileReader();
            //         reader.onload = (readerEvent) => {
            //           const url = readerEvent.target?.result as string;
            //           editor.chain().focus().setImage({ src: url }).run();
            //         };
            //         reader.readAsDataURL(file);
            //       }
            //     };
            //     input.click();
            //   },
            // },
            // TODO: Uncomment when ready to enable Video upload
            // {
            //   title: 'Video',
            //   description: 'Upload any video from your device.',
            //   icon: '🎥',
            //   command: ({ editor, range }: any) => {
            //     editor.chain().focus().deleteRange(range).run();
            //     const input = document.createElement('input');
            //     input.type = 'file';
            //     input.accept = 'video/*';
            //     input.onchange = (e: any) => {
            //       const file = e.target?.files?.[0];
            //       if (file) {
            //         const reader = new FileReader();
            //         reader.onload = (readerEvent) => {
            //           const url = readerEvent.target?.result as string;
            //           editor
            //             .chain()
            //             .focus()
            //             .insertContent(`<video controls src="${url}" class="tiptap-video"></video>`)
            //             .run();
            //         };
            //         reader.readAsDataURL(file);
            //       }
            //     };
            //     input.click();
            //   },
            // },
            // TODO: Uncomment when ready to enable File attachment
            // {
            //   title: 'File attachment',
            //   description: 'Upload any file from your device.',
            //   icon: '📎',
            //   command: ({ editor, range }: any) => {
            //     editor.chain().focus().deleteRange(range).run();
            //     const input = document.createElement('input');
            //     input.type = 'file';
            //     input.onchange = (e: any) => {
            //       const file = e.target?.files?.[0];
            //       if (file) {
            //         const reader = new FileReader();
            //         reader.onload = (readerEvent) => {
            //           const url = readerEvent.target?.result as string;
            //           editor
            //             .chain()
            //             .focus()
            //             .insertContent(
            //               `<a href="${url}" download="${file.name}" class="tiptap-file-attachment">📎 ${file.name}</a>`
            //             )
            //             .run();
            //         };
            //         reader.readAsDataURL(file);
            //       }
            //     };
            //     input.click();
            //   },
            // },
            {
              title: 'Table',
              description: 'Insert a table.',
              icon: Table,
              command: ({ editor, range }: any) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run();
              },
            },
            {
              title: 'Callout',
              description: 'Insert callout notice.',
              icon: Info,
              command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setCallout().run();
              },
            },
          ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
        },
        render: () => {
          let component: any;
          let popup: any;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props: any) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return component.ref?.onKeyDown(props);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
