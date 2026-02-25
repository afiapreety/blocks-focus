import { Node, mergeAttributes } from '@tiptap/core';

export const Details = Node.create({
  name: 'details',

  group: 'block',

  content: 'detailsSummary detailsContent',

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(HTMLAttributes, { class: 'details-block' }), 0];
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: 'detailsSummary',
                content: [{ type: 'text', text: 'Toggle' }],
              },
              {
                type: 'detailsContent',
                content: [{ type: 'paragraph' }],
              },
            ],
          });
        },
    } as any;
  },
});

export const DetailsSummary = Node.create({
  name: 'detailsSummary',

  content: 'inline*',

  parseHTML() {
    return [{ tag: 'summary' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes, { class: 'details-summary' }), 0];
  },
});

export const DetailsContent = Node.create({
  name: 'detailsContent',

  content: 'block+',

  parseHTML() {
    return [{ tag: 'div[data-type="details-content"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'details-content',
        class: 'details-content',
      }),
      0,
    ];
  },
});
