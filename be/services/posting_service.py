# backend/services/posting_service.py
import httpx
from sqlalchemy.orm import Session
import sys
import os

# Add the parent directory to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PlatformCredential


# --- Dev.to Posting ---
async def post_to_devto(api_key: str, title: str, markdown_content: str, canonical_url: str = None, tags: list = None):
    """
    Post an article to Dev.to using their API
    
    Args:
        api_key: Dev.to API key
        title: Article title
        markdown_content: Article content in markdown format
        canonical_url: Optional canonical URL for SEO
        tags: Optional list of tags (max 4 tags allowed by Dev.to)
    
    Returns:
        dict: Response from Dev.to API containing article details
    """
    headers = {"api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "article": {
            "title": title,
            "body_markdown": markdown_content,
            "published": True,  # Or False for draft
            "tags": tags if tags else [],
        }
    }
    if canonical_url:
        payload["article"]["canonical_url"] = canonical_url

    async with httpx.AsyncClient() as client:
        response = await client.post("https://dev.to/api/articles", json=payload, headers=headers)
    response.raise_for_status()  # Will raise an exception for 4XX/5XX errors
    return response.json()


# --- Hashnode Posting ---
async def post_to_hashnode(api_key: str, publication_id: str, title: str, markdown_content: str, tags_data: list = None, cover_image_url: str = None, canonical_url: str = None):
    """
    Post an article to Hashnode using their GraphQL API
    
    Args:
        api_key: Hashnode Personal Access Token
        publication_id: Hashnode publication ID (required)
        title: Article title
        markdown_content: Article content in markdown format
        tags_data: Optional list of tag objects with id/name/slug
        cover_image_url: Optional cover image URL
        canonical_url: Optional canonical URL for SEO
    
    Returns:
        dict: Response from Hashnode API containing post details
    """
    # Hashnode uses GraphQL. You'll need the user's publication ID.
    # The PAT (api_key) is sent as an Authorization: Bearer <PAT> header.
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    query = """
        mutation PublishPost($input: PublishPostInput!) {
            publishPost(input: $input) {
                post {
                    id
                    slug
                    url
                    title
                }
            }
        }
    """
    variables_input = {
        "title": title,
        "contentMarkdown": markdown_content,
        "publicationId": publication_id,  # User needs to provide this or you fetch it
        "tags": tags_data if tags_data else []  # e.g., [{ id: "tag_id_1", name: "Tag1"}] or [{slug:"tag1", name:"Tag1"}] - check API
    }
    if cover_image_url:
        variables_input["coverImageOptions"] = {"coverImageURL": cover_image_url}
    if canonical_url:
        # Hashnode might handle canonical URLs via frontmatter in Markdown or a specific field
        # For example, add to markdown: --- \ncanonicalUrl: <URL>\n---
        # Adding canonical URL to frontmatter
        markdown_with_canonical = f"---\ncanonicalUrl: {canonical_url}\n---\n\n{markdown_content}"
        variables_input["contentMarkdown"] = markdown_with_canonical

    payload = {"query": query, "variables": {"input": variables_input}}

    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.hashnode.com/", json=payload, headers=headers)
    response.raise_for_status()
    return response.json()


# --- Medium Posting (DUMMY IMPLEMENTATION) ---
async def post_to_medium(access_token: str, user_id_on_medium: str, title: str, markdown_content: str, canonical_url: str = None, tags: list = None, publish_status: str = "public"):
    """
    DUMMY IMPLEMENTATION - Medium API has been deprecated
    
    This function simulates a successful Medium post without actually posting.
    Returns a mock response similar to what the actual API would return.
    
    Args:
        access_token: Medium access token (not used)
        user_id_on_medium: Medium user ID (not used)
        title: Article title
        markdown_content: Article content in markdown format
        canonical_url: Optional canonical URL for SEO
        tags: Optional list of tags
        publish_status: Publication status (public, draft, unlisted)
    
    Returns:
        dict: Mock response simulating successful Medium post
    """
    # Since Medium API is deprecated, return a mock successful response
    mock_response = {
        "data": {
            "id": f"mock_medium_id_{hash(title) % 10000}",
            "title": title,
            "authorId": user_id_on_medium or "mock_author_id",
            "url": f"https://medium.com/@user/{title.lower().replace(' ', '-')}",
            "canonicalUrl": canonical_url,
            "publishStatus": publish_status,
            "publishedAt": "2024-01-01T00:00:00.000Z",
            "license": "all-rights-reserved",
            "licenseUrl": "https://medium.com/policy/9db0094a1e0f",
            "tags": tags if tags else []
        }
    }
    
    print(f"[DUMMY] Would post to Medium: '{title}' with status '{publish_status}'")
    print(f"[DUMMY] Content length: {len(markdown_content)} characters")
    if canonical_url:
        print(f"[DUMMY] Canonical URL: {canonical_url}")
    if tags:
        print(f"[DUMMY] Tags: {', '.join(tags)}")
    
    return mock_response


# Helper to get Medium user ID (DUMMY IMPLEMENTATION)
async def get_medium_user_id(access_token: str):
    """
    DUMMY IMPLEMENTATION - Medium API has been deprecated
    
    Returns a mock Medium user ID.
    
    Args:
        access_token: Medium access token (not used)
    
    Returns:
        str: Mock Medium user ID
    """
    print("[DUMMY] Would fetch Medium user ID")
    return "mock_medium_user_id_12345"


# Helper to get Hashnode publication ID
async def get_hashnode_publication_id(api_key: str, hostname: str):
    """
    Get Hashnode publication ID by hostname
    
    Args:
        api_key: Hashnode Personal Access Token
        hostname: Publication hostname (e.g., "yourblog.hashnode.dev")
    
    Returns:
        str: Publication ID
    """
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    query = """
        query GetPublication($host: String!) {
            publication(host: $host) {
                id
                title
                displayTitle
                url
            }
        }
    """
    payload = {"query": query, "variables": {"host": hostname}}

    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.hashnode.com/", json=payload, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    if "errors" in data:
        raise Exception(f"Hashnode API error: {data['errors']}")
    
    publication = data.get("data", {}).get("publication")
    if not publication:
        raise Exception(f"Publication not found for hostname: {hostname}")
    
    return publication["id"]


# Main function to cross-post to all connected platforms
async def cross_post_article(db: Session, user_id: int, title: str, markdown_content: str, canonical_url: str = None, tags: list = None):
    """
    Cross-post an article to all connected platforms for a user
    
    Args:
        db: Database session
        user_id: User ID
        title: Article title
        markdown_content: Article content in markdown format
        canonical_url: Optional canonical URL for SEO
        tags: Optional list of tags
    
    Returns:
        dict: Results from each platform posting attempt
    """
    results = {}
    
    # Get user's platform credentials
    credentials = db.query(PlatformCredential).filter(
        PlatformCredential.user_id == user_id
    ).all()
    
    for credential in credentials:
        platform = credential.platform_name
        
        try:
            if platform == "dev.to" and credential.api_key:
                result = await post_to_devto(
                    api_key=credential.api_key,
                    title=title,
                    markdown_content=markdown_content,
                    canonical_url=canonical_url,
                    tags=tags[:4] if tags else None  # Dev.to allows max 4 tags
                )
                results[platform] = {"success": True, "data": result}
                
            elif platform == "hashnode" and credential.api_key:
                # Use the new publication_id field
                publication_id = credential.publication_id
                if not publication_id:
                    results[platform] = {"success": False, "error": "Publication ID not found"}
                    continue
                    
                result = await post_to_hashnode(
                    api_key=credential.api_key,
                    publication_id=publication_id,
                    title=title,
                    markdown_content=markdown_content,
                    canonical_url=canonical_url,
                    tags_data=[{"name": tag} for tag in tags] if tags else None
                )
                results[platform] = {"success": True, "data": result}
                
            elif platform == "medium" and credential.access_token:
                # Dummy implementation for Medium
                result = await post_to_medium(
                    access_token=credential.access_token,
                    user_id_on_medium=credential.platform_user_id,
                    title=title,
                    markdown_content=markdown_content,
                    canonical_url=canonical_url,
                    tags=tags
                )
                results[platform] = {"success": True, "data": result, "note": "DUMMY IMPLEMENTATION"}
                
        except Exception as e:
            results[platform] = {"success": False, "error": str(e)}
    
    return results 