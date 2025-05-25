
import httpx
from sqlalchemy.orm import Session
import sys
import os


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PlatformCredential



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
            "published": True,  
            "tags": tags if tags else [],
        }
    }
    if canonical_url:
        payload["article"]["canonical_url"] = canonical_url

    async with httpx.AsyncClient() as client:
        response = await client.post("https://dev.to/api/articles", json=payload, headers=headers)
    response.raise_for_status()  
    return response.json()



async def post_to_hashnode(api_key: str, publication_id: str, title: str, markdown_content: str, tags_data: list = None, cover_image_url: str = None, canonical_url: str = None):
    """
    Post an article to Hashnode - creates a draft and then publishes it
    
    Args:
        api_key: Hashnode Personal Access Token
        publication_id: ID of the Hashnode publication
        title: Article title
        markdown_content: Article content in markdown format
        tags_data: List of tag objects with name (will be converted to proper format)
        cover_image_url: Optional cover image URL
        canonical_url: Optional canonical URL for SEO
    
    Returns:
        dict: Response from Hashnode API
    """
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    
    
    formatted_tags = []
    if tags_data:
        for tag in tags_data:
            if isinstance(tag, dict) and "name" in tag:
                tag_name = tag["name"]
                
                tag_slug = tag_name.lower().replace(" ", "-").replace("_", "-")
                formatted_tags.append({
                    "slug": tag_slug,
                    "name": tag_name
                })
            elif isinstance(tag, str):
                tag_slug = tag.lower().replace(" ", "-").replace("_", "-")
                formatted_tags.append({
                    "slug": tag_slug,
                    "name": tag
                })
    
    
    create_draft_query = """
        mutation CreateDraft($input: CreateDraftInput!) {
            createDraft(input: $input) {
                draft {
                    id
                    slug
                    title
                }
            }
        }
    """
    
    post_input = {
        "title": title,
        "contentMarkdown": markdown_content,
        "publicationId": publication_id
    }
    
    
    if formatted_tags:
        post_input["tags"] = formatted_tags
    
    if cover_image_url:
        post_input["coverImageOptions"] = {"coverImageURL": cover_image_url}
    
    if canonical_url:
        post_input["originalArticleURL"] = canonical_url
    
    create_payload = {"query": create_draft_query, "variables": {"input": post_input}}

    async with httpx.AsyncClient() as client:
        
        response = await client.post("https://gql.hashnode.com/", json=create_payload, headers=headers)
    
    
    if response.status_code != 200:
        print(f"❌ Hashnode Create Draft HTTP Error: {response.status_code}")
        print(f"❌ Response Headers: {dict(response.headers)}")
        print(f"❌ Response Body: {response.text}")
        response.raise_for_status()
    
    create_data = response.json()
    
    if "errors" in create_data:
        raise Exception(f"Hashnode Create Draft API error: {create_data['errors']}")
    
    
    draft_data = create_data.get("data", {}).get("createDraft", {}).get("draft")
    if not draft_data or not draft_data.get("id"):
        raise Exception(f"Failed to create draft: {create_data}")
    
    draft_id = draft_data["id"]
    print(f"✅ Draft created successfully with ID: {draft_id}")
    
    
    publish_draft_query = """
        mutation PublishDraft($input: PublishDraftInput!) {
            publishDraft(input: $input) {
                post {
                    id
                    slug
                    title
                    url
                    publishedAt
                }
            }
        }
    """
    
    publish_input = {
        "draftId": draft_id
    }
    
    publish_payload = {"query": publish_draft_query, "variables": {"input": publish_input}}
    
    async with httpx.AsyncClient() as client:
        
        response = await client.post("https://gql.hashnode.com/", json=publish_payload, headers=headers)
    
    
    if response.status_code != 200:
        print(f"❌ Hashnode Publish Draft HTTP Error: {response.status_code}")
        print(f"❌ Response Headers: {dict(response.headers)}")
        print(f"❌ Response Body: {response.text}")
        response.raise_for_status()
    
    publish_data = response.json()
    
    if "errors" in publish_data:
        raise Exception(f"Hashnode Publish Draft API error: {publish_data['errors']}")
    
    
    post_data = publish_data.get("data", {}).get("publishDraft", {}).get("post")
    if not post_data:
        raise Exception(f"Failed to publish draft: {publish_data}")
    
    print(f"🎉 Post published successfully!")
    print(f"   Post ID: {post_data.get('id')}")
    print(f"   Post URL: {post_data.get('url')}")
    print(f"   Published at: {post_data.get('publishedAt')}")
    
    
    return {
        "data": {
            "createDraft": create_data["data"]["createDraft"],
            "publishDraft": publish_data["data"]["publishDraft"]
        },
        "draft_id": draft_id,
        "post_id": post_data.get("id"),
        "post_url": post_data.get("url"),
        "published_at": post_data.get("publishedAt")
    }



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



async def get_hashnode_user_publications(api_key: str):
    """
    Get user's Hashnode publications using their Personal Access Token
    
    Args:
        api_key: Hashnode Personal Access Token
    
    Returns:
        list: List of user's publications with id, title, and url
    """
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    query = """
        query GetUserPublications {
            me {
                publications(first: 10) {
                    edges {
                        node {
                            id
                            title
                            displayTitle
                            url
                            isTeam
                        }
                    }
                }
            }
        }
    """
    payload = {"query": query}

    async with httpx.AsyncClient() as client:
        response = await client.post("https://gql.hashnode.com/", json=payload, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    if "errors" in data:
        raise Exception(f"Hashnode API error: {data['errors']}")
    
    me_data = data.get("data", {}).get("me")
    if not me_data:
        raise Exception("Failed to fetch user data from Hashnode")
    
    publications = me_data.get("publications", {}).get("edges", [])
    return [edge["node"] for edge in publications]



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
        response = await client.post("https://gql.hashnode.com/", json=payload, headers=headers)
    response.raise_for_status()
    
    data = response.json()
    if "errors" in data:
        raise Exception(f"Hashnode API error: {data['errors']}")
    
    publication = data.get("data", {}).get("publication")
    if not publication:
        raise Exception(f"Publication not found for hostname: {hostname}")
    
    return publication["id"]



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
                    tags=tags[:4] if tags else None  
                )
                results[platform] = {"success": True, "data": result}
                
            elif platform == "hashnode" and credential.api_key:
                
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