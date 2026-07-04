import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MediaGallery, type MediaItem } from '@/components/features/media/MediaGallery';
import { MediaUploadForm } from '@/components/features/media/MediaUploadForm';

describe('MediaGallery', () => {
  it('presents featured media as a curated league artifact', () => {
    render(
      <MediaGallery
        items={[
          {
            id: 'vegas-entrance',
            title: 'Vegas Draft Entrance',
            file_url: '/Vegasentrance.MOV',
            file_type: 'video',
            created_at: '2018-08-25T00:00:00.000Z',
            member: null,
            featured: true,
            context: 'Vegas draft weekend',
            caption: 'The tone-setter for a league trip that still gets referenced years later.',
          },
        ] satisfies MediaItem[]}
      />,
    );

    expect(screen.getByText('League Artifact')).toBeInTheDocument();
    expect(screen.getByText('Vegas draft weekend')).toBeInTheDocument();
    expect(
      screen.getByText('The tone-setter for a league trip that still gets referenced years later.'),
    ).toBeInTheDocument();
  });
});

describe('MediaUploadForm', () => {
  it('hides upload controls when uploads are not allowed', () => {
    const props = {
      seasons: [],
      members: [],
      canUpload: false,
    };

    const { container } = render(<MediaUploadForm {...props} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByLabelText('Media File')).not.toBeInTheDocument();
  });
});
