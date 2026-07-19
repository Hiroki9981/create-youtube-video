import argparse
import os
import sys
import pickle
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# Explicitly request read/write access to YouTube account
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

def get_authenticated_service(client_secrets_file, token_file):
    credentials = None
    
    # The file token_file stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists(token_file):
        try:
            with open(token_file, 'rb') as token:
                credentials = pickle.load(token)
        except Exception as e:
            print(f"Warning: Could not load saved token: {e}. Starting re-authentication.")

    # If there are no (valid) credentials available, let the user log in.
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            print("Refreshing access token...")
            try:
                credentials.refresh(Request())
            except Exception as e:
                print(f"Failed to refresh token: {e}. Starting fresh authentication.")
                credentials = None
                
        if not credentials:
            if not os.path.exists(client_secrets_file):
                print(f"\nError: Client secrets file not found at '{client_secrets_file}'.")
                print("Please create an OAuth Desktop credential in the Google Cloud Console,")
                # Use standard file URL style for cross-platform ease
                print(f"download the JSON file, and save it as '{client_secrets_file}' in the project root.")
                print("For a detailed setup guide, please read instructions.md.\n")
                sys.exit(1)
                
            print(f"Opening browser for authentication using {client_secrets_file}...")
            flow = InstalledAppFlow.from_client_secrets_file(client_secrets_file, SCOPES)
            credentials = flow.run_local_server(port=0)
            
        # Save the credentials for the next run
        os.makedirs(os.path.dirname(token_file) or '.', exist_ok=True)
        with open(token_file, 'wb') as token:
            pickle.dump(credentials, token)
            print(f"Authorization token saved successfully to '{token_file}'")

    return build('youtube', 'v3', credentials=credentials)

def upload_video(youtube, options):
    tags = None
    if options.tags:
        tags = [tag.strip() for tag in options.tags.split(',')]

    body = {
        'snippet': {
            'title': options.title,
            'description': options.description,
            'tags': tags,
            'categoryId': '22' # 22 is for People & Blogs, a common category. '19' is Travel & Events.
        },
        'status': {
            'privacyStatus': options.privacy,
            'selfDeclaredMadeForKids': False
        }
    }

    # Call the API's videos.insert method to create and upload the video.
    print(f"Uploading file: {options.file}")
    print(f"Title: {options.title}")
    print(f"Privacy Status: {options.privacy}")
    
    media = MediaFileUpload(options.file, chunksize=-1, resumable=True, mimetype='video/mp4')
    
    try:
        request = youtube.videos().insert(
            part=','.join(body.keys()),
            body=body,
            media_body=media
        )
        
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                print(f"Uploaded {int(status.progress() * 100)}%")
                
        video_id = response['id']
        print(f"\nSuccess! Video uploaded successfully. Video ID: {video_id}")
        print(f"Watch URL: https://www.youtube.com/watch?v={video_id}")
        
        # Upload custom thumbnail if specified
        if options.thumbnail:
            if os.path.exists(options.thumbnail):
                print(f"Uploading thumbnail: {options.thumbnail}...")
                try:
                    youtube.thumbnails().set(
                        videoId=video_id,
                        media_body=MediaFileUpload(options.thumbnail, mimetype='image/png')
                    ).execute()
                    print("Thumbnail uploaded successfully!")
                except HttpError as e:
                    if e.resp.status == 403:
                        print("\n[Warning] Custom thumbnail upload was denied (403).")
                        print("Your YouTube channel might need phone/SMS verification to enable custom thumbnails.")
                        print("You can verify your channel at: https://www.youtube.com/verify")
                        print("The video was still successfully uploaded!\n")
                    else:
                        print(f"Warning: Failed to upload thumbnail: {e}")
            else:
                print(f"Warning: Thumbnail file not found at '{options.thumbnail}'")
                
    except HttpError as e:
        print(f"An HTTP error occurred: {e.resp.status} - {e.content.decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred during upload: {e}")
        sys.exit(1)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Upload video to YouTube with SEO metadata.')
    parser.add_argument('--file', default='out/inbound-tourism.mp4', help='Video file to upload')
    parser.add_argument('--title', default='【激変】日本に来る外国人が多すぎる！訪日観光客の10年推移が凄まじい #Shorts #統計', help='Video title')
    parser.add_argument('--description', default='日本政府観光局（JNTO）の統計データ（2016年〜2025年）をもとに、訪日外国人観光客の累計推移を可視化しました。\n\n#shorts #観光 #インバウンド #旅行 #統計 #データ可視化', help='Video description')
    parser.add_argument('--tags', default='shorts, 観光, インバウンド, 旅行, 統計, データ可視化', help='Comma-separated tags')
    parser.add_argument('--privacy', default='unlisted', choices=['public', 'private', 'unlisted'], help='Video privacy status')
    parser.add_argument('--client-secrets', default='client_secret.json', help='Path to Google APIs client_secret.json file')
    parser.add_argument('--token', default='.credentials/youtube-upload-token.pickle', help='Path to save OAuth token')
    parser.add_argument('--thumbnail', default='public/data/inbound-tourism/thumbnail.png', help='Path to thumbnail image')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Error: Video file not found at '{args.file}'. Please render the video first.")
        sys.exit(1)
        
    youtube_service = get_authenticated_service(args.client_secrets, args.token)
    upload_video(youtube_service, args)
